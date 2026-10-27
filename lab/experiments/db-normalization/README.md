# Thử nghiệm: db-normalization

**Câu hỏi.** Khi một giá trị (tên phòng ban) bị lặp ở nhiều dòng, cập nhật thiếu một chỗ gây ra gì?

**Môi trường.** PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), cài sẵn trong môi trường build Linux của Claude; client Node.js v22.22.0 với driver `pg` 8.16.3. Chạy ngày 14/10/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc dùng PostgreSQL 16 có sẵn
npm install
node experiments/db-normalization/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- Bảng gộp: sau khi chỉ sửa các dòng của một nhân viên, cùng một phòng ban có hai tên ('Phòng Nhân sự' và 'Phòng Nhân sự và Đào tạo').
- Bảng đã tách: một câu update sửa một dòng trong `departments`, mọi yêu cầu đều thấy tên mới.

**Giới hạn của kết luận.**

- Thử nghiệm chỉ minh chứng bất thường khi cập nhật; không đo hiệu năng của join so với bảng gộp.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Dữ liệu lặp và bất thường khi cập nhật
Máy chủ: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v22.22.0, driver pg 8.16.3
Thời điểm chạy: 2026-10-14T07:18:56.831Z
[A]    56ms  drop schema if exists exp_norm cascade
[A]    58ms  NOTICE: drop cascades to 4 other objects
   DETAIL: drop cascades to table exp_norm.requests_flat
drop cascades to table exp_norm.departments
drop cascades to table exp_norm.users
drop cascades to table exp_norm.requests
   [A] → DROP
[A]    67ms  create schema exp_norm
   [A] → CREATE
[A]    69ms  set search_path = exp_norm
   [A] → SET

## Bảng gộp: tên phòng ban lặp lại trong mỗi yêu cầu
[A]    69ms  create table requests_flat ( id integer primary key, title text not null, requester_email text not null, department_name text not null)
   [A] → CREATE
[A]    74ms  insert into requests_flat values (1, 'Xin cấp laptop', 'an@example.com', 'Phòng Nhân sự'), (2, 'Đăng ký đào tạo', 'an@example.com', 'Phòng Nhân sự'), (3, 'Xin nghỉ phép', 'chi@example.com', 'Phòng Nhân sự'), (4, 'Cấp quyền VPN', 'binh@example.com', 'Phòng Kỹ thuật')
   [A] → INSERT 4

## Đổi tên phòng ban nhưng chỉ sửa ở những yêu cầu đang xem
-- Giống một màn hình chỉ cập nhật các dòng của một nhân viên.
[A]    76ms  update requests_flat set department_name = 'Phòng Nhân sự và Đào tạo' where requester_email = 'an@example.com'
   [A] → UPDATE 2
[A]    77ms  select department_name, count(*) from requests_flat where requester_email <> 'binh@example.com' group by department_name order by 1
   [A] →
   department_name          | count
   -------------------------+------
   Phòng Nhân sự            | 1    
   Phòng Nhân sự và Đào tạo | 2    
   (2 dòng)
-- Cùng một phòng ban giờ có hai tên khác nhau.

## Bảng đã tách: tên phòng ban nằm ở đúng một chỗ
[A]    79ms  create table departments (id integer primary key, name text not null unique)
   [A] → CREATE
[A]    84ms  create table users (email text primary key, department_id integer not null references departments)
   [A] → CREATE
[A]    88ms  create table requests (id integer primary key, title text not null, requester_email text not null references users)
   [A] → CREATE
[A]    92ms  insert into departments values (1, 'Phòng Nhân sự'), (2, 'Phòng Kỹ thuật')
   [A] → INSERT 2
[A]    93ms  insert into users values ('an@example.com', 1), ('chi@example.com', 1), ('binh@example.com', 2)
   [A] → INSERT 3
[A]    94ms  insert into requests values (1, 'Xin cấp laptop', 'an@example.com'), (2, 'Đăng ký đào tạo', 'an@example.com'), (3, 'Xin nghỉ phép', 'chi@example.com'), (4, 'Cấp quyền VPN', 'binh@example.com')
   [A] → INSERT 4
[A]    96ms  update departments set name = 'Phòng Nhân sự và Đào tạo' where id = 1
   [A] → UPDATE 1
[A]    97ms  select d.name, count(*) from requests r join users u on u.email = r.requester_email join departments d on d.id = u.department_id group by d.name order by 1
   [A] →
   name                     | count
   -------------------------+------
   Phòng Kỹ thuật           | 1    
   Phòng Nhân sự và Đào tạo | 3    
   (2 dòng)
-- Một câu update sửa đúng một dòng; mọi yêu cầu đều thấy tên mới.
```
