# Thử nghiệm: db-database-dbms

**Câu hỏi.** Hai RDBMS cùng theo chuẩn SQL có xử lý chuỗi rỗng giống nhau không?

**Môi trường.** PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), cài sẵn trong môi trường build Linux của Claude; client Node.js v22.22.0 với driver `pg` 8.16.3. Chạy ngày 14/10/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc dùng PostgreSQL 16 có sẵn
npm install
node experiments/db-database-dbms/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- Trên PostgreSQL 16.15, `'' is null` là `false` và `length('')` là 0: chuỗi rỗng là một giá trị.
- Cột `text not null` nhận chuỗi rỗng; bảng có 0 dòng NULL và 1 dòng chuỗi rỗng.

**Giới hạn của kết luận.**

- Phần Oracle chưa chạy trong lab này. Tài liệu Oracle SQL Language Reference (Release 26) ghi rằng Oracle hiện coi chuỗi rỗng là NULL và khuyên không dựa vào điều đó. Muốn kiểm trên máy bạn: `docker compose --profile oracle up -d`, rồi chạy `insert into requests values (1, '')` với cột `not null` và ghi kết quả vào đây.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Chuỗi rỗng và NULL trên PostgreSQL
Máy chủ: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v22.22.0, driver pg 8.16.3
Thời điểm chạy: 2026-10-14T07:20:49.930Z
[A]    47ms  drop schema if exists exp_dbms cascade
[A]    48ms  NOTICE: drop cascades to table exp_dbms.requests
   [A] → DROP
[A]    51ms  create schema exp_dbms
   [A] → CREATE
[A]    53ms  set search_path = exp_dbms
   [A] → SET

## 1. Chuỗi rỗng có phải NULL không
[A]    53ms  select '' is null as chuoi_rong_la_null, length('') as do_dai
   [A] →
   chuoi_rong_la_null | do_dai
   -------------------+-------
   false              | 0     
   (1 dòng)

## 2. Cột NOT NULL nhận chuỗi rỗng
[A]    54ms  create table requests (id integer primary key, title text not null)
   [A] → CREATE
[A]    59ms  insert into requests values (1, '')
   [A] → INSERT 1
[A]    60ms  select count(*) filter (where title is null) as so_dong_null, count(*) filter (where title = '') as so_dong_rong from requests
   [A] →
   so_dong_null | so_dong_rong
   -------------+-------------
   0            | 1           
   (1 dòng)
-- Trên PostgreSQL, chuỗi rỗng qua được NOT NULL. Phần Oracle chưa chạy trong lab này; xem README.
```
