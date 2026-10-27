# Thử nghiệm: db-transaction-boundary

**Câu hỏi.** Hai quản lý cùng bấm quyết định một yêu cầu: kiểm tra ở ứng dụng rồi ghi khác gì update có điều kiện trong một transaction?

**Môi trường.** PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), cài sẵn trong môi trường build Linux của Claude; client Node.js v22.22.0 với driver `pg` 8.16.3. Chạy ngày 15/10/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc dùng PostgreSQL 16 có sẵn
npm install
node experiments/db-transaction-boundary/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- 1. Kiểm tra ở ứng dụng rồi ghi, mỗi lệnh tự commit: cả hai đều thấy `pending` và đều ghi; lịch sử có hai quyết định trái ngược, trạng thái cuối `rejected` của người ghi sau.
- 2. Update có điều kiện `where id = 1 and status = 'pending'` trong transaction: lần thứ hai đổi 0 dòng, ứng dụng rollback và biết để báo người dùng; lịch sử chỉ có một quyết định.
- 3. Hai update có điều kiện chạy đồng thời: B chờ transaction A kết thúc (`wait_event_type = Lock`, `wait_event = transactionid`); sau khi A commit, câu update của B đánh giá lại điều kiện và đổi 0 dòng.
- 4. Đọc rồi update **không điều kiện**, cả hai bước trong cùng một transaction Read Committed: cả hai đọc `pending`; B chờ A commit rồi vẫn `UPDATE 1`, ghi đè thành `rejected`; lịch sử có hai quyết định. Đặt cả hai bước vào một transaction không đủ để chặn lost update.
- 5. Khóa dòng ngay lúc đọc bằng `SELECT ... FOR UPDATE`, kiểm tra ở ứng dụng rồi mới ghi: B chờ ngay ở câu `SELECT ... FOR UPDATE` (`wait_event = transactionid`); sau khi A commit, B đọc được trạng thái `approved`, rollback và không ghi; lịch sử chỉ có một quyết định.

**Giới hạn của kết luận.**

- Hành vi chờ rồi đánh giá lại điều kiện là của Read Committed trên PostgreSQL 16. Ở Repeatable Read, transaction sửa một dòng đã bị transaction khác sửa và commit sẽ bị rollback với lỗi `could not serialize access due to concurrent update` (SQLSTATE 40001) theo [tài liệu PostgreSQL 16, mục 13.2](https://www.postgresql.org/docs/16/transaction-iso.html); thử nghiệm này không chạy mức đó, xem lab `db-isolation-levels`.
- Bước 1 là thứ tự xen kẽ do script sắp đặt, không phải đồng thời thật; bước 3 và 4 chạy đồng thời thật.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Ranh giới transaction khi kiểm tra rồi mới ghi
Máy chủ: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v22.22.0, driver pg 8.16.3
Thời điểm chạy: 2026-10-15T02:43:02.334Z
[A]    48ms  drop schema if exists exp_tb cascade
[A]    50ms  NOTICE: drop cascades to 2 other objects
   DETAIL: drop cascades to table exp_tb.requests
drop cascades to table exp_tb.request_status_history
   [A] → DROP
[A]    53ms  create schema exp_tb
   [A] → CREATE
[A]    55ms  create table exp_tb.requests (id integer primary key, status text not null, approved_by integer)
   [A] → CREATE
[A]    60ms  create table exp_tb.request_status_history (id integer generated always as identity, request_id integer not null, to_status text not null, changed_by integer not null)
   [A] → CREATE

## 1. Đọc trạng thái, kiểm tra ở ứng dụng, rồi mới ghi (mỗi lệnh tự commit)
[A]    66ms  select status from requests where id = 1
   [A] →
   status 
   -------
   pending
   (1 dòng)
[B]    67ms  select status from requests where id = 1
   [B] →
   status 
   -------
   pending
   (1 dòng)
[A]    68ms  update requests set status = 'approved', approved_by = 10 where id = 1
   [A] → UPDATE 1
[A]    69ms  insert into request_status_history (request_id, to_status, changed_by) values (1, 'approved', 10)
   [A] → INSERT 1
[B]    69ms  update requests set status = 'rejected', approved_by = 11 where id = 1
   [B] → UPDATE 1
[B]    70ms  insert into request_status_history (request_id, to_status, changed_by) values (1, 'rejected', 11)
   [B] → INSERT 1
[A]    71ms  select * from requests
   [A] →
   id | status   | approved_by
   ---+----------+------------
   1  | rejected | 11         
   (1 dòng)
[A]    71ms  select request_id, to_status, changed_by from request_status_history order by id
   [A] →
   request_id | to_status | changed_by
   -----------+-----------+-----------
   1          | approved  | 10        
   1          | rejected  | 11        
   (2 dòng)
-- Cả hai quản lý đều thấy pending và đều ghi: lịch sử có hai quyết định trái ngược, kết quả phụ thuộc ai ghi sau.

## 2. Update có điều kiện trong một transaction: lệnh tự kiểm tra trạng thái và trả về số dòng đã đổi
[A]    75ms  select status from requests where id = 1
   [A] →
   status 
   -------
   pending
   (1 dòng)
[B]    76ms  select status from requests where id = 1
   [B] →
   status 
   -------
   pending
   (1 dòng)
[A]    76ms  begin
   [A] → BEGIN
[A]    77ms  update requests set status = $1, approved_by = $2 where id = 1 and status = 'pending' returning id   -- tham số: ["approved",10]
   [A] →
   id
   --
   1 
   (1 dòng)
[A]    78ms  insert into request_status_history (request_id, to_status, changed_by) values (1, $1, $2)   -- tham số: ["approved",10]
   [A] → INSERT 1
[A]    78ms  commit
   [A] → COMMIT
[B]    79ms  begin
   [B] → BEGIN
[B]    79ms  update requests set status = $1, approved_by = $2 where id = 1 and status = 'pending' returning id   -- tham số: ["rejected",11]
   [B] →
   id
   --
   (0 dòng)
[B]    79ms  rollback
   [B] → ROLLBACK
-- B: yêu cầu không còn ở trạng thái pending, báo cho người dùng thay vì ghi đè
[A]    80ms  select * from requests
   [A] →
   id | status   | approved_by
   ---+----------+------------
   1  | approved | 10         
   (1 dòng)
[A]    80ms  select request_id, to_status, changed_by from request_status_history order by id
   [A] →
   request_id | to_status | changed_by
   -----------+-----------+-----------
   1          | approved  | 10        
   (1 dòng)

## 3. Hai quyết định chạy đồng thời thật sự
[A]    84ms  begin
   [A] → BEGIN
[B]    84ms  begin
   [B] → BEGIN
[A]    84ms  update requests set status = 'approved', approved_by = 10 where id = 1 and status = 'pending' returning id
   [A] →
   id
   --
   1 
   (1 dòng)
[B]    85ms  update requests set status = 'rejected', approved_by = 11 where id = 1 and status = 'pending' returning id
[monitor]   593ms  select application_name, wait_event_type, wait_event from pg_stat_activity where application_name = 'lab-B'
   [monitor] →
   application_name | wait_event_type | wait_event   
   -----------------+-----------------+--------------
   lab-B            | Lock            | transactionid
   (1 dòng)
-- B chờ transaction A kết thúc (wait_event_type = Lock, wait_event = transactionid).
[A]   598ms  insert into request_status_history (request_id, to_status, changed_by) values (1, 'approved', 10)
   [A] → INSERT 1
[A]   599ms  commit
   [A] → COMMIT
   [B] →
   id
   --
   (0 dòng)
-- Sau khi A commit, câu update của B đánh giá lại điều kiện trên dòng mới và đổi 0 dòng.
[B]   600ms  rollback
   [B] → ROLLBACK
[A]   600ms  select * from requests
   [A] →
   id | status   | approved_by
   ---+----------+------------
   1  | approved | 10         
   (1 dòng)

## 4. Đọc rồi update không điều kiện, cả hai bước trong cùng một transaction Read Committed
[A]   605ms  begin
   [A] → BEGIN
[B]   605ms  begin
   [B] → BEGIN
[A]   605ms  select status from requests where id = 1
   [A] →
   status 
   -------
   pending
   (1 dòng)
[B]   606ms  select status from requests where id = 1
   [B] →
   status 
   -------
   pending
   (1 dòng)
-- Cả hai transaction đều thấy pending và ứng dụng quyết định ghi.
[A]   607ms  update requests set status = 'approved', approved_by = 10 where id = 1
   [A] → UPDATE 1
[B]   607ms  update requests set status = 'rejected', approved_by = 11 where id = 1
[A]  1108ms  insert into request_status_history (request_id, to_status, changed_by) values (1, 'approved', 10)
   [A] → INSERT 1
[A]  1109ms  commit
   [A] → COMMIT
   [B] → UPDATE 1
[B]  1111ms  insert into request_status_history (request_id, to_status, changed_by) values (1, 'rejected', 11)
   [B] → INSERT 1
[B]  1111ms  commit
   [B] → COMMIT
[A]  1112ms  select * from requests
   [A] →
   id | status   | approved_by
   ---+----------+------------
   1  | rejected | 11         
   (1 dòng)
[A]  1112ms  select request_id, to_status, changed_by from request_status_history order by id
   [A] →
   request_id | to_status | changed_by
   -----------+-----------+-----------
   1          | approved  | 10        
   1          | rejected  | 11        
   (2 dòng)
-- B chờ A commit rồi vẫn ghi đè, vì điều kiện where id = 1 vẫn đúng với dòng mới.

## 5. Khóa dòng ngay lúc đọc bằng SELECT ... FOR UPDATE, kiểm tra ở ứng dụng rồi mới ghi
[A]  1116ms  begin
   [A] → BEGIN
[B]  1116ms  begin
   [B] → BEGIN
[A]  1117ms  select status from requests where id = 1 for update
   [A] →
   status 
   -------
   pending
   (1 dòng)
[B]  1117ms  select status from requests where id = 1 for update
[monitor]  1627ms  select application_name, wait_event_type, wait_event from pg_stat_activity where application_name = 'lab-B'
   [monitor] →
   application_name | wait_event_type | wait_event   
   -----------------+-----------------+--------------
   lab-B            | Lock            | transactionid
   (1 dòng)
-- B chờ ngay ở câu SELECT ... FOR UPDATE vì A đang giữ khóa dòng.
[A]  1632ms  update requests set status = 'approved', approved_by = 10 where id = 1
   [A] → UPDATE 1
[A]  1632ms  insert into request_status_history (request_id, to_status, changed_by) values (1, 'approved', 10)
   [A] → INSERT 1
[A]  1633ms  commit
   [A] → COMMIT
   [B] →
   status  
   --------
   approved
   (1 dòng)
-- B: sau khi được khóa, B đọc thấy trạng thái approved, nên rollback và báo người dùng
[B]  1634ms  rollback
   [B] → ROLLBACK
[A]  1634ms  select * from requests
   [A] →
   id | status   | approved_by
   ---+----------+------------
   1  | approved | 10         
   (1 dòng)
[A]  1635ms  select request_id, to_status, changed_by from request_status_history order by id
   [A] →
   request_id | to_status | changed_by
   -----------+-----------+-----------
   1          | approved  | 10        
   (1 dòng)
```
