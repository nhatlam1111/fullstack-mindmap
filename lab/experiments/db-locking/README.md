# Thử nghiệm: db-locking

**Câu hỏi.** Khi nhiều phiên cùng sửa một dòng hoặc đổi schema, khóa hoạt động thế nào trên PostgreSQL?

**Môi trường.** PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), cài sẵn trong môi trường build Linux của Claude; client Node.js v22.22.0 với driver `pg` 8.16.3. Chạy ngày 14/10/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc dùng PostgreSQL 16 có sẵn
npm install
node experiments/db-locking/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- 1. Lost update: hai phiên đọc `approvals = 0` rồi cùng ghi 1 (mỗi lệnh tự commit, Read Committed); kết quả còn 1 thay vì 2.
- 2. `SELECT ... FOR UPDATE`: B chờ (`wait_event = transactionid`) khoảng 1 giây, đúng bằng thời gian script cho A giữ khóa, rồi đọc giá trị mới; kết quả đủ 2.
- 2b. `approvals = approvals + 1` từ hai phiên đồng thời ở Read Committed: B chờ A commit rồi cộng vào giá trị mới; kết quả 2.
- 2c. Cùng câu đó nhưng B ở Repeatable Read: sau khi A commit, B nhận 40001 `could not serialize access due to concurrent update`; giá trị là 1, B phải chạy lại cả transaction.
- 3. Deadlock: sau khoảng 1 giây (`deadlock_timeout = 1s`), A bị hủy với 40P01 `deadlock detected`, câu update đang chờ của B chạy tiếp.
- 4. Hàng đợi khóa: A giữ `AccessShareLock` (transaction đọc chưa commit); `ALTER TABLE ... ADD COLUMN` của B chờ `AccessExclusiveLock`; `SELECT` của C cũng chờ (`AccessShareLock`, granted = false) khoảng 1,5 giây, bằng thời gian script giữ A.
- 5. Với `lock_timeout = '500ms'`, `ALTER TABLE` bỏ cuộc (55P03) sau khoảng 500 ms; `SELECT` của C gửi trong lúc ALTER đang chờ vẫn phải chờ khoảng 400 ms, tức tới khi ALTER bỏ cuộc.

**Giới hạn của kết luận.**

- Thời gian chờ do script điều khiển (sleep), không phải số đo hiệu năng; riêng 1 giây của deadlock là `deadlock_timeout`.
- Hành vi khóa là của PostgreSQL 16; Oracle xử lý DDL và khóa theo cơ chế khác.
- Bước 4 dùng `ADD COLUMN` (cần ACCESS EXCLUSIVE); các dạng ALTER TABLE khác có thể cần khóa nhẹ hơn.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Locking và deadlock trên PostgreSQL
Máy chủ: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v22.22.0, driver pg 8.16.3
Thời điểm chạy: 2026-10-14T07:18:49.198Z
[A]    69ms  drop schema if exists exp_lock cascade
[A]    70ms  NOTICE: drop cascades to table exp_lock.requests
   [A] → DROP
[A]    73ms  create schema exp_lock
   [A] → CREATE
[A]    74ms  create table exp_lock.requests (id integer primary key, status text not null, approvals integer not null default 0)
   [A] → CREATE

## 1. Lost update: hai phiên đọc rồi ghi đè giá trị đã tính ở ứng dụng
[A]    82ms  select approvals from requests where id = 1
   [A] →
   approvals
   ---------
   0        
   (1 dòng)
[B]    83ms  select approvals from requests where id = 1
   [B] →
   approvals
   ---------
   0        
   (1 dòng)
[A]    84ms  update requests set approvals = $1 where id = 1   -- tham số: [1]
   [A] → UPDATE 1
[B]    86ms  update requests set approvals = $1 where id = 1   -- tham số: [1]
   [B] → UPDATE 1
[A]    86ms  select approvals from requests where id = 1
   [A] →
   approvals
   ---------
   1        
   (1 dòng)
-- Hai lượt duyệt nhưng chỉ còn 1: lượt của A bị ghi đè.

## 2. SELECT ... FOR UPDATE: phiên thứ hai chờ tới khi phiên đầu commit
[A]    90ms  begin
   [A] → BEGIN
[A]    90ms  select approvals from requests where id = 1 for update
   [A] →
   approvals
   ---------
   0        
   (1 dòng)
[B]    91ms  begin
   [B] → BEGIN
[B]    91ms  select approvals from requests where id = 1 for update
[C]  1092ms  select pid, wait_event_type, wait_event, left(query, 60) as query from pg_stat_activity where application_name = 'lab-B'
   [C] →
   pid  | wait_event_type | wait_event    | query                                                 
   -----+-----------------+---------------+-------------------------------------------------------
   1646 | Lock            | transactionid | select approvals from requests where id = 1 for update
   (1 dòng)
[A]  1097ms  update requests set approvals = approvals + 1 where id = 1
   [A] → UPDATE 1
[A]  1097ms  commit
   [A] → COMMIT
   [B] →
   approvals
   ---------
   1        
   (1 dòng)
-- B chờ khóa khoảng 1000ms rồi mới đọc được
[B]  1099ms  update requests set approvals = $1 where id = 1   -- tham số: [2]
   [B] → UPDATE 1
[B]  1100ms  commit
   [B] → COMMIT
[A]  1101ms  select approvals from requests where id = 1
   [A] →
   approvals
   ---------
   2        
   (1 dòng)
-- Đủ 2 lượt duyệt.

## 2b. Update nguyên tử approvals = approvals + 1 từ hai phiên chạy đồng thời (Read Committed)
[A]  1111ms  begin
   [A] → BEGIN
[B]  1112ms  begin
   [B] → BEGIN
[A]  1112ms  update requests set approvals = approvals + 1 where id = 1
   [A] → UPDATE 1
[B]  1113ms  update requests set approvals = approvals + 1 where id = 1
[A]  1414ms  commit
   [A] → COMMIT
   [B] → UPDATE 1
[B]  1416ms  commit
   [B] → COMMIT
[A]  1416ms  select approvals from requests where id = 1
   [A] →
   approvals
   ---------
   2        
   (1 dòng)
-- B chờ A commit, rồi cộng thêm vào giá trị A vừa ghi: đủ 2 lượt.

## 2c. Cùng câu update nguyên tử nhưng B chạy ở Repeatable Read
[A]  1421ms  begin
   [A] → BEGIN
[B]  1422ms  begin isolation level repeatable read
   [B] → BEGIN
[B]  1422ms  select approvals from requests where id = 2
   [B] →
   approvals
   ---------
   0        
   (1 dòng)
[A]  1423ms  update requests set approvals = approvals + 1 where id = 1
   [A] → UPDATE 1
[B]  1424ms  update requests set approvals = approvals + 1 where id = 1
[A]  1724ms  commit
   [A] → COMMIT
[B]  1727ms  LỖI 40001: could not serialize access due to concurrent update
[B]  1727ms  rollback
   [B] → ROLLBACK
[A]  1727ms  select approvals from requests where id = 1
   [A] →
   approvals
   ---------
   1        
   (1 dòng)
-- Ở Repeatable Read, B không được ghi lên dòng đã bị transaction khác sửa và commit sau khi snapshot của B được lấy: phải chạy lại cả transaction.

## 3. Deadlock: hai phiên khóa hai dòng theo thứ tự ngược nhau
[A]  1732ms  begin
   [A] → BEGIN
[B]  1732ms  begin
   [B] → BEGIN
[A]  1733ms  update requests set status = 'approved' where id = 1
   [A] → UPDATE 1
[B]  1733ms  update requests set status = 'approved' where id = 2
   [B] → UPDATE 1
[A]  1734ms  update requests set status = 'approved' where id = 2
[B]  2035ms  update requests set status = 'approved' where id = 1
[A]  2735ms  LỖI 40P01: deadlock detected
   DETAIL: Process 1645 waits for ShareLock on transaction 1342; blocked by process 1646.
Process 1646 waits for ShareLock on transaction 1341; blocked by process 1645.
   [B] → UPDATE 1
[A]  2735ms  rollback
   [A] → ROLLBACK
[B]  2735ms  rollback
   [B] → ROLLBACK
-- Sau khoảng deadlock_timeout (mặc định 1s), PostgreSQL hủy một transaction (ở lần chạy này là A, lỗi 40P01); câu update đang chờ của B chạy tiếp.
[A]  2736ms  show deadlock_timeout
   [A] →
   deadlock_timeout
   ----------------
   1s              
   (1 dòng)

## 4. Hàng đợi khóa: ALTER TABLE chờ sau một transaction đọc dài, chặn luôn các SELECT đến sau
[A]  2740ms  begin
   [A] → BEGIN
[A]  2741ms  select count(*) from requests
   [A] →
   count
   -----
   2    
   (1 dòng)
-- A chưa commit, vẫn giữ khóa ACCESS SHARE trên bảng.
[B]  2741ms  alter table requests add column note text
[C]  3042ms  select count(*) from requests
[monitor]  4554ms  select application_name, wait_event_type, wait_event, left(query, 50) as query from pg_stat_activity where application_name in ('lab-B', 'lab-C') order by 1
   [monitor] →
   application_name | wait_event_type | wait_event | query                                    
   -----------------+-----------------+------------+------------------------------------------
   lab-B            | Lock            | relation   | alter table requests add column note text
   lab-C            | Lock            | relation   | select count(*) from requests            
   (2 dòng)
[monitor]  4557ms  select l.mode, l.granted, a.application_name from pg_locks l join pg_stat_activity a on a.pid = l.pid where l.relation = 'exp_lock.requests'::regclass order by a.application_name, l.mode
   [monitor] →
   mode                | granted | application_name
   --------------------+---------+-----------------
   AccessShareLock     | true    | lab-A           
   AccessExclusiveLock | false   | lab-B           
   AccessShareLock     | false   | lab-C           
   (3 dòng)
[A]  4559ms  commit
   [A] → COMMIT
   [B] → ALTER
   [C] →
   count
   -----
   2    
   (1 dòng)
-- SELECT của C phải chờ khoảng 1500ms

## 5. Cùng tình huống nhưng đặt lock_timeout cho câu đổi schema; C gửi SELECT trong lúc ALTER đang chờ
[A]  4565ms  begin
   [A] → BEGIN
[A]  4566ms  select count(*) from requests
   [A] →
   count
   -----
   2    
   (1 dòng)
[B]  4566ms  set lock_timeout = '500ms'
   [B] → SET
[B]  4567ms  alter table requests add column note2 text
[C]  4667ms  select count(*) from requests
[B]  5068ms  LỖI 55P03: canceling statement due to lock timeout
-- ALTER TABLE bỏ cuộc sau khoảng 500ms
   [C] →
   count
   -----
   2    
   (1 dòng)
-- SELECT của C chờ khoảng 400ms, tức tới khi ALTER bỏ cuộc
[A]  5069ms  commit
   [A] → COMMIT
[B]  5069ms  reset lock_timeout
   [B] → RESET
```
