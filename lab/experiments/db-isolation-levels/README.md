# Thử nghiệm: db-isolation-levels

**Câu hỏi.** Hai phiên đọc ghi đồng thời thấy gì ở Read Committed, Repeatable Read và Serializable trên PostgreSQL?

**Môi trường.** PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), cài sẵn trong môi trường build Linux của Claude; client Node.js v22.22.0 với driver `pg` 8.16.3. Chạy ngày 14/10/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc dùng PostgreSQL 16 có sẵn
npm install
node experiments/db-isolation-levels/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- Read Committed: hai lần đọc trong cùng transaction thấy 2 rồi 1 yêu cầu pending (non-repeatable read).
- Repeatable Read: lần đọc thứ hai vẫn thấy đúng snapshot cũ, không thấy cả dòng bị sửa lẫn dòng mới chèn.
- Repeatable Read: cập nhật dòng mà phiên khác đã sửa và commit bị lỗi 40001 `could not serialize access due to concurrent update`.
- Write skew: ở Repeatable Read, hai admin mỗi người tắt một người duyệt khác nhau, cả hai commit thành công, phòng IT còn 0 người duyệt.
- Cùng kịch bản ở Serializable: commit thứ hai bị lỗi 40001 `could not serialize access due to read/write dependencies among transactions`, phòng IT còn 1 người duyệt.

**Giới hạn của kết luận.**

- Chỉ đúng cho PostgreSQL 16. Thử nghiệm không chạy trên Oracle nên không kết luận gì về hành vi của Oracle ở các ví dụ 4–5; xem tài liệu Oracle được dẫn trong bài.
- Thứ tự chạy được điều khiển bằng script; trong ứng dụng thật, xen kẽ này xảy ra ngẫu nhiên.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Isolation level trên PostgreSQL
Máy chủ: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v22.22.0, driver pg 8.16.3
Thời điểm chạy: 2026-10-14T07:18:48.923Z
[setup]    45ms  drop schema if exists exp_iso cascade
[setup]    46ms  NOTICE: drop cascades to 2 other objects
   DETAIL: drop cascades to table exp_iso.requests
drop cascades to table exp_iso.approvers
   [setup] → DROP
[setup]    50ms  create schema exp_iso
   [setup] → CREATE
[setup]    52ms  create table exp_iso.requests (id integer primary key, department text not null, status text not null)
   [setup] → CREATE
[setup]    56ms  create table exp_iso.approvers (user_id integer primary key, department text not null, active boolean not null)
   [setup] → CREATE
[A]    87ms  set search_path = exp_iso
   [A] → SET
[B]    88ms  set search_path = exp_iso
   [B] → SET

## 1. Read Committed: hai lần đọc trong cùng transaction thấy kết quả khác nhau
[A]   100ms  begin isolation level read committed
   [A] → BEGIN
[A]   101ms  select count(*) as pending from requests where status = 'pending'
   [A] →
   pending
   -------
   2      
   (1 dòng)
[B]   102ms  update requests set status = 'approved' where id = 1
   [B] → UPDATE 1
[A]   105ms  select count(*) as pending from requests where status = 'pending'
   [A] →
   pending
   -------
   1      
   (1 dòng)
[A]   106ms  commit
   [A] → COMMIT
-- Mỗi câu lệnh lấy snapshot mới, nên thấy thay đổi B đã commit giữa chừng.

## 2. Repeatable Read: snapshot cố định từ câu lệnh đầu tiên của transaction
[A]   117ms  begin isolation level repeatable read
   [A] → BEGIN
[A]   118ms  select id, status from requests where status = 'pending' order by id
   [A] →
   id | status 
   ---+--------
   1  | pending
   2  | pending
   (2 dòng)
[B]   118ms  update requests set status = 'approved' where id = 1
   [B] → UPDATE 1
[B]   119ms  insert into requests values (4, 'IT', 'pending')
   [B] → INSERT 1
[A]   120ms  select id, status from requests where status = 'pending' order by id
   [A] →
   id | status 
   ---+--------
   1  | pending
   2  | pending
   (2 dòng)
-- A vẫn thấy dòng 1 là pending và không thấy dòng 4 mới chèn (không có phantom read trên PostgreSQL).
[A]   121ms  commit
   [A] → COMMIT
[A]   121ms  select id, status from requests where status = 'pending' order by id
   [A] →
   id | status 
   ---+--------
   2  | pending
   4  | pending
   (2 dòng)
-- Sau khi commit, transaction mới của A mới thấy thay đổi của B.

## 3. Repeatable Read: cập nhật dòng mà transaction khác đã sửa và commit
[A]   129ms  begin isolation level repeatable read
   [A] → BEGIN
[A]   130ms  select status from requests where id = 2
   [A] →
   status 
   -------
   pending
   (1 dòng)
[B]   130ms  update requests set status = 'rejected' where id = 2
   [B] → UPDATE 1
[A]   131ms  update requests set status = 'approved' where id = 2
[A]   131ms  LỖI 40001: could not serialize access due to concurrent update
[A]   131ms  rollback
   [A] → ROLLBACK
-- Ứng dụng phải bắt lỗi SQLSTATE 40001 và chạy lại cả transaction.

## 4. Write skew ở Repeatable Read: mỗi admin tắt một người duyệt, phòng IT mất cả hai
[A]   136ms  begin isolation level repeatable read
   [A] → BEGIN
[B]   137ms  begin isolation level repeatable read
   [B] → BEGIN
[A]   137ms  select count(*) as dang_hoat_dong from approvers where department = 'IT' and active
   [A] →
   dang_hoat_dong
   --------------
   2             
   (1 dòng)
[B]   137ms  select count(*) as dang_hoat_dong from approvers where department = 'IT' and active
   [B] →
   dang_hoat_dong
   --------------
   2             
   (1 dòng)
-- Cả hai thấy còn 2 người duyệt, nên đều nghĩ tắt một người là an toàn.
[A]   138ms  update approvers set active = false where user_id = 10
   [A] → UPDATE 1
[B]   139ms  update approvers set active = false where user_id = 11
   [B] → UPDATE 1
[A]   139ms  commit
   [A] → COMMIT
[B]   140ms  commit
   [B] → COMMIT
[A]   141ms  select count(*) as dang_hoat_dong from approvers where department = 'IT' and active
   [A] →
   dang_hoat_dong
   --------------
   0             
   (1 dòng)

## 5. Cùng kịch bản ở Serializable: một transaction bị hủy
[A]   147ms  begin isolation level serializable
   [A] → BEGIN
[B]   148ms  begin isolation level serializable
   [B] → BEGIN
[A]   148ms  select count(*) as dang_hoat_dong from approvers where department = 'IT' and active
   [A] →
   dang_hoat_dong
   --------------
   2             
   (1 dòng)
[B]   148ms  select count(*) as dang_hoat_dong from approvers where department = 'IT' and active
   [B] →
   dang_hoat_dong
   --------------
   2             
   (1 dòng)
[A]   149ms  update approvers set active = false where user_id = 10
   [A] → UPDATE 1
[B]   149ms  update approvers set active = false where user_id = 11
   [B] → UPDATE 1
[A]   150ms  commit
   [A] → COMMIT
[B]   150ms  commit
[B]   151ms  LỖI 40001: could not serialize access due to read/write dependencies among transactions
   DETAIL: Reason code: Canceled on identification as a pivot, during commit attempt.
[A]   151ms  select count(*) as dang_hoat_dong from approvers where department = 'IT' and active
   [A] →
   dang_hoat_dong
   --------------
   1             
   (1 dòng)
```
