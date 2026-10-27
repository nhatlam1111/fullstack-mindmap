# Thử nghiệm: db-tables-keys-constraints

**Câu hỏi.** Khi có primary key, foreign key, unique, check và not null, database xử lý dữ liệu sai thế nào? Foreign key có tự tạo index không?

**Môi trường.** PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), cài sẵn trong môi trường build Linux của Claude; client Node.js v22.22.0 với driver `pg` 8.16.3. Chạy ngày 14/10/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc dùng PostgreSQL 16 có sẵn
npm install
node experiments/db-tables-keys-constraints/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- Năm lần ghi sai đều bị từ chối, mỗi lần một SQLSTATE: foreign key 23503 (người gửi 999), check 23514 (`status = 'done'`), unique 23505 (email trùng), not null 23502, và xóa phòng ban còn nhân viên 23503 (`on delete restrict`). Không dòng sai nào lọt vào bảng.
- `pg_indexes` chỉ có index cho primary key và unique; cột `users.department_id` và `requests.requester_id` (foreign key) không có index nào.
- Cột `status` cho phép NULL với `check (status in ('pending','approved'))`: chèn NULL thành công, chèn `'done'` bị 23514.
- `on delete cascade`: xóa 1 dòng ở bảng cha trả về `DELETE 1`, trong khi 50 dòng ở bảng con cũng biến mất (còn 0).
- UNIQUE trên (a, b): mặc định chèn được hai dòng `(1, NULL)`; với `unique nulls not distinct`, dòng thứ hai bị 23505.
- Trong một transaction, sau lỗi 23505 thì câu lệnh tiếp theo bị 25P02 cho tới khi rollback.

**Giới hạn của kết luận.**

- Schema chỉ đủ cho thử nghiệm, không phải lời giải bài thực hành tuần 1.
- Mã lỗi và thông báo là của PostgreSQL 16; Oracle dùng mã khác (ví dụ ORA-02290 cho check) và có xử lý NULL trong unique nhiều cột khác (xem bài).
- Không đo chi phí hiệu năng của constraint hay của việc thiếu index ở cột foreign key.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Constraint chặn dữ liệu sai
Máy chủ: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v22.22.0, driver pg 8.16.3
Thời điểm chạy: 2026-10-14T07:18:57.202Z
[A]    54ms  drop schema if exists exp_constraints cascade
[A]    56ms  NOTICE: drop cascades to 8 other objects
   DETAIL: drop cascades to table exp_constraints.departments
drop cascades to table exp_constraints.users
drop cascades to table exp_constraints.requests
drop cascades to table exp_constraints.check_nullable
drop cascades to table exp_constraints.cascade_parent
drop cascades to table exp_constraints.cascade_child
drop cascades to table exp_constraints.uq_default
drop cascades to table exp_constraints.uq_nulls_not_distinct
   [A] → DROP
[A]    66ms  create schema exp_constraints
   [A] → CREATE
[A]    67ms  set search_path = exp_constraints
   [A] → SET

## Tạo bảng với primary key, foreign key, unique, check
[A]    68ms  create table departments ( id integer generated always as identity primary key, name text not null unique)
   [A] → CREATE
[A]    72ms  create table users ( id integer generated always as identity primary key, email text not null unique, department_id integer not null references departments on delete restrict, role text not null check (role in ('employee', 'manager', 'admin')))
   [A] → CREATE
[A]    76ms  create table requests ( id bigint generated always as identity primary key, requester_id integer not null references users, title text not null check (length(title) between 3 and 200), status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')))
   [A] → CREATE

## Dữ liệu hợp lệ
[A]    80ms  insert into departments (name) values ('Nhân sự'), ('Kỹ thuật') returning id, name
   [A] →
   id | name    
   ---+---------
   1  | Nhân sự 
   2  | Kỹ thuật
   (2 dòng)
[A]    81ms  insert into users (email, department_id, role) values ('an@example.com', 1, 'employee'), ('binh@example.com', 2, 'manager') returning id, email
   [A] →
   id | email           
   ---+-----------------
   1  | an@example.com  
   2  | binh@example.com
   (2 dòng)
[A]    83ms  insert into requests (requester_id, title) values (1, 'Xin cấp laptop') returning id, status
   [A] →
   id | status 
   ---+--------
   1  | pending
   (1 dòng)

## Vi phạm foreign key: người gửi không tồn tại
[A]    84ms  insert into requests (requester_id, title) values (999, 'Yêu cầu của người không tồn tại')
[A]    84ms  LỖI 23503: insert or update on table "requests" violates foreign key constraint "requests_requester_id_fkey"
   DETAIL: Key (requester_id)=(999) is not present in table "users".

## Vi phạm check: trạng thái không có trong danh sách
[A]    85ms  update requests set status = 'done' where id = 1
[A]    85ms  LỖI 23514: new row for relation "requests" violates check constraint "requests_status_check"
   DETAIL: Failing row contains (1, 1, Xin cấp laptop, done).

## Vi phạm unique: email trùng
[A]    85ms  insert into users (email, department_id, role) values ('an@example.com', 2, 'employee')
[A]    86ms  LỖI 23505: duplicate key value violates unique constraint "users_email_key"
   DETAIL: Key (email)=(an@example.com) already exists.

## Vi phạm not null
[A]    86ms  insert into requests (requester_id, title) values (null, 'Không có người gửi')
[A]    86ms  LỖI 23502: null value in column "requester_id" of relation "requests" violates not-null constraint
   DETAIL: Failing row contains (3, null, Không có người gửi, pending).

## Xóa phòng ban vẫn còn nhân viên (on delete restrict)
[A]    86ms  delete from departments where id = 1
[A]    87ms  LỖI 23503: update or delete on table "departments" violates foreign key constraint "users_department_id_fkey" on table "users"
   DETAIL: Key (id)=(1) is still referenced from table "users".

## Dữ liệu sau các lần thử: không có dòng sai nào lọt vào
[A]    87ms  select r.id, r.title, r.status, u.email from requests r join users u on u.id = r.requester_id
   [A] →
   id | title          | status  | email         
   ---+----------------+---------+---------------
   1  | Xin cấp laptop | pending | an@example.com
   (1 dòng)
[A]    88ms  select count(*) as so_nhan_vien from users
   [A] →
   so_nhan_vien
   ------------
   2           
   (1 dòng)

## Foreign key không tự tạo index ở cột tham chiếu
[A]    88ms  select tablename, indexname from pg_indexes where schemaname = 'exp_constraints' order by tablename, indexname
   [A] →
   tablename   | indexname           
   ------------+---------------------
   departments | departments_name_key
   departments | departments_pkey    
   requests    | requests_pkey       
   users       | users_email_key     
   users       | users_pkey          
   (5 dòng)

## CHECK chấp nhận NULL khi cột cho phép NULL
[A]    91ms  create table check_nullable (status text check (status in ('pending', 'approved')))
   [A] → CREATE
[A]    93ms  insert into check_nullable values (null)
   [A] → INSERT 1
[A]    94ms  insert into check_nullable values ('done')
[A]    95ms  LỖI 23514: new row for relation "check_nullable" violates check constraint "check_nullable_status_check"
   DETAIL: Failing row contains (done).
[A]    95ms  select count(*) as so_dong, count(status) as so_dong_co_status from check_nullable
   [A] →
   so_dong | so_dong_co_status
   --------+------------------
   1       | 0                
   (1 dòng)

## ON DELETE CASCADE: thẻ lệnh DELETE chỉ đếm dòng ở bảng bị xóa
[A]    95ms  create table cascade_parent (id integer primary key)
   [A] → CREATE
[A]    97ms  create table cascade_child (id integer generated always as identity primary key, parent_id integer not null references cascade_parent on delete cascade)
   [A] → CREATE
[A]    99ms  insert into cascade_parent values (1)
   [A] → INSERT 1
[A]   100ms  insert into cascade_child (parent_id) select 1 from generate_series(1, 50)
   [A] → INSERT 50
[A]   101ms  delete from cascade_parent where id = 1
   [A] → DELETE 1
[A]   102ms  select count(*) as so_dong_con_lai from cascade_child
   [A] →
   so_dong_con_lai
   ---------------
   0              
   (1 dòng)

## UNIQUE nhiều cột khi một cột là NULL
[A]   102ms  create table uq_default (a integer, b integer, unique (a, b))
   [A] → CREATE
[A]   104ms  insert into uq_default values (1, null), (1, null)
   [A] → INSERT 2
[A]   104ms  select count(*) as so_dong from uq_default
   [A] →
   so_dong
   -------
   2      
   (1 dòng)
[A]   105ms  create table uq_nulls_not_distinct (a integer, b integer, unique nulls not distinct (a, b))
   [A] → CREATE
[A]   106ms  insert into uq_nulls_not_distinct values (1, null)
   [A] → INSERT 1
[A]   107ms  insert into uq_nulls_not_distinct values (1, null)
[A]   107ms  LỖI 23505: duplicate key value violates unique constraint "uq_nulls_not_distinct_a_b_key"
   DETAIL: Key (a, b)=(1, null) already exists.

## Vi phạm constraint bên trong một transaction
[A]   107ms  begin
   [A] → BEGIN
[A]   108ms  insert into departments (name) values ('Nhân sự')
[A]   108ms  LỖI 23505: duplicate key value violates unique constraint "departments_name_key"
   DETAIL: Key (name)=(Nhân sự) already exists.
[A]   108ms  select 1 as cau_lenh_tiep_theo
[A]   108ms  LỖI 25P02: current transaction is aborted, commands ignored until end of transaction block
[A]   108ms  rollback
   [A] → ROLLBACK
```
