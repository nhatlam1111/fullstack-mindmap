# Thử nghiệm: db-schema-data-model

**Câu hỏi.** Trên PostgreSQL, "schema" là gì trong thực tế? Khi hai schema có bảng cùng tên, câu lệnh không ghi tên schema dùng bảng nào?

**Môi trường.** PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), cài sẵn trong môi trường build Linux của Claude; client Node.js v22.22.0 với driver `pg` 8.16.3. Chạy ngày 15/10/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc dùng PostgreSQL 16 có sẵn
npm install
node experiments/db-schema-data-model/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- `search_path` mặc định của phiên là `"$user", public`.
- Khi không schema nào trên `search_path` có bảng `requests`, `select * from requests` báo lỗi `42P01: relation "requests" does not exist`, dù bảng tên đó có ở `exp_hr` và `exp_it`.
- Cùng câu `select * from requests`: với `search_path = exp_hr, public` trả về bảng của `exp_hr` (2 cột); với `search_path = exp_it, exp_hr, public` trả về bảng của `exp_it` (3 cột, có `device`).
- Với `search_path = exp_it, exp_hr, public`, tên đầy đủ `exp_hr.requests` vẫn trả về bảng của `exp_hr`.
- `information_schema.columns` liệt kê cấu trúc của hai bảng: `exp_hr.requests` có 2 cột, `exp_it.requests` có 3 cột.
- Role thường `lab_schema_user` (không phải superuser, không phải chủ database) có `search_path` mặc định `"$user", public`, không có quyền `CREATE` trên `public`; `create table new_requests (id integer)` không ghi schema bị từ chối với `42501: permission denied for schema public`.

**Giới hạn của kết luận.**

- Chỉ chạy trên PostgreSQL. Ở Oracle, mỗi user account sở hữu đúng một schema cùng tên; thử nghiệm này không chạy trên Oracle.
- Các bước 1–5 chạy bằng role `lab`, là superuser và chủ database lab; role này tạo được bảng ở `public`. Bước 6 dùng role thường.
- Database lab được tạo mới trên PostgreSQL 16, không nâng cấp từ bản 14 trở về trước; database nâng cấp từ các bản đó có thể vẫn cho mọi role quyền `CREATE` trên `public`.
- Không thử quyền truy cập giữa các schema (`GRANT USAGE`).

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Schema là không gian tên trên PostgreSQL
Máy chủ: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v22.22.0, driver pg 8.16.3
Thời điểm chạy: 2026-10-15T03:06:58.764Z
[app]    62ms  drop schema if exists exp_hr cascade
[app]    64ms  NOTICE: drop cascades to table exp_hr.requests
   [app] → DROP
[app]    69ms  drop schema if exists exp_it cascade
[app]    70ms  NOTICE: drop cascades to table exp_it.requests
   [app] → DROP
[app]    72ms  create schema exp_hr
   [app] → CREATE
[app]    73ms  create schema exp_it
   [app] → CREATE
[app]    74ms  create table exp_hr.requests (id integer primary key, title text not null)
   [app] → CREATE
[app]    78ms  create table exp_it.requests (id integer primary key, title text not null, device text)
   [app] → CREATE
[app]    81ms  insert into exp_hr.requests values (1, 'Xin nghỉ phép')
   [app] → INSERT 1
[app]    83ms  insert into exp_it.requests values (1, 'Xin cấp laptop', 'laptop')
   [app] → INSERT 1
-- Hai bảng cùng tên requests nằm ở hai schema khác nhau, cấu trúc khác nhau.

## 1. search_path mặc định của phiên
[app]    84ms  show search_path
   [app] →
   search_path    
   ---------------
   "$user", public
   (1 dòng)

## 2. Tên không kèm schema khi không schema nào trên search_path có bảng requests
[app]    85ms  select * from requests
[app]    86ms  LỖI 42P01: relation "requests" does not exist

## 3. Cùng một câu lệnh, đổi search_path thì trỏ tới bảng khác
[app]    86ms  set search_path = exp_hr, public
   [app] → SET
[app]    87ms  select * from requests
   [app] →
   id | title        
   ---+--------------
   1  | Xin nghỉ phép
   (1 dòng)
[app]    87ms  set search_path = exp_it, exp_hr, public
   [app] → SET
[app]    88ms  select * from requests
   [app] →
   id | title          | device
   ---+----------------+-------
   1  | Xin cấp laptop | laptop
   (1 dòng)
-- Schema đầu tiên trên search_path có bảng requests được dùng.

## 4. Tên đầy đủ schema.bảng không phụ thuộc search_path
[app]    89ms  select * from exp_hr.requests
   [app] →
   id | title        
   ---+--------------
   1  | Xin nghỉ phép
   (1 dòng)

## 5. Cấu trúc của hai bảng đọc được từ catalog information_schema
[app]    89ms  select table_schema, table_name, column_name, data_type, is_nullable from information_schema.columns where table_name = 'requests' and table_schema in ('exp_hr', 'exp_it') order by table_schema, ordinal_position
   [app] →
   table_schema | table_name | column_name | data_type | is_nullable
   -------------+------------+-------------+-----------+------------
   exp_hr       | requests   | id          | integer   | NO         
   exp_hr       | requests   | title       | text      | NO         
   exp_it       | requests   | id          | integer   | NO         
   exp_it       | requests   | title       | text      | NO         
   exp_it       | requests   | device      | text      | YES        
   (5 dòng)

## 6. Role thường (không phải chủ database, không phải superuser) tạo bảng không ghi schema
[app]    96ms  do $$ begin if not exists (select from pg_roles where rolname = 'lab_schema_user') then create role lab_schema_user login password 'lab_schema_user'; end if; end $$
   [app] → DO
[app]   106ms  select rolname, rolsuper from pg_roles where rolname = 'lab_schema_user'
   [app] →
   rolname         | rolsuper
   ----------------+---------
   lab_schema_user | false   
   (1 dòng)
[app]   107ms  select has_schema_privilege('lab_schema_user', 'public', 'CREATE') as create_tren_public
   [app] →
   create_tren_public
   ------------------
   false             
   (1 dòng)
[user]   121ms  show search_path
   [user] →
   search_path    
   ---------------
   "$user", public
   (1 dòng)
[user]   122ms  create table new_requests (id integer)
[user]   122ms  LỖI 42501: permission denied for schema public
-- Database lab được tạo mới trên PostgreSQL 16, không nâng cấp từ bản 14 trở về trước.
```
