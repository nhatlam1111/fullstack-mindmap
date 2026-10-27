# Thử nghiệm: db-parameter-binding

**Câu hỏi.** Ghép chuỗi nhập của người dùng vào SQL khác gì truyền tham số?

**Môi trường.** PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), cài sẵn trong môi trường build Linux của Claude; client Node.js v22.22.0 với driver `pg` 8.16.3. Chạy ngày 15/10/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc dùng PostgreSQL 16 có sẵn
npm install
node experiments/db-parameter-binding/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- Ghép chuỗi với `an@example.com' or '1'='1` trả về cả 3 yêu cầu của mọi người.
- Cùng chuỗi đó truyền dưới dạng tham số `$1` trả về 0 dòng; tham số đúng email trả về 1 dòng.
- `PREPARE`/`EXECUTE` dùng một câu lệnh cho nhiều giá trị; `pg_prepared_statements` liệt kê câu `by_email` với `from_sql = true`. Hai truy vấn `$1` không có name ở bước 2 không có trong danh sách.
- Truy vấn node-postgres có `name: 'by_email_named'`, chạy hai lần, xuất hiện trong `pg_prepared_statements` với `from_sql = false`, tức prepared statement có tên do giao thức tạo trong phiên đó.

**Giới hạn của kết luận.**

- Không đo hiệu năng và không kiểm tra máy chủ có dùng generic plan hay không; lợi ích dùng lại kế hoạch thực thi trên Oracle được dẫn từ tài liệu Oracle trong bài.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Ghép chuỗi SQL và bind variable
Máy chủ: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v22.22.0, driver pg 8.16.3
Thời điểm chạy: 2026-10-15T02:44:52.334Z
[app]    48ms  drop schema if exists exp_bind cascade
[app]    49ms  NOTICE: drop cascades to table exp_bind.requests
   [app] → DROP
[app]    52ms  create schema exp_bind
   [app] → CREATE
[app]    53ms  set search_path = exp_bind
   [app] → SET
[app]    53ms  create table requests (id integer primary key, requester_email text not null, title text not null)
   [app] → CREATE
[app]    58ms  insert into requests values (1, 'an@example.com', 'Xin cấp laptop'), (2, 'binh@example.com', 'Lương tháng 9 bị sai'), (3, 'chi@example.com', 'Xin nghỉ phép')
   [app] → INSERT 3

## 1. Ghép chuỗi: chuỗi nhập từ ô tìm kiếm trở thành một phần câu lệnh
-- chuỗi người dùng nhập: an@example.com' or '1'='1
[app]    59ms  select id, requester_email, title from requests where requester_email = 'an@example.com' or '1'='1'
   [app] →
   id | requester_email  | title               
   ---+------------------+---------------------
   1  | an@example.com   | Xin cấp laptop      
   2  | binh@example.com | Lương tháng 9 bị sai
   3  | chi@example.com  | Xin nghỉ phép       
   (3 dòng)
-- Trả về yêu cầu của mọi người, kể cả yêu cầu nhạy cảm của người khác.

## 2. Bind variable: chuỗi nhập chỉ được so sánh như một giá trị
[app]    61ms  select id, requester_email, title from requests where requester_email = $1   -- tham số: ["an@example.com' or '1'='1"]
   [app] →
   id | requester_email | title
   ---+-----------------+------
   (0 dòng)
[app]    62ms  select id, requester_email, title from requests where requester_email = $1   -- tham số: ["an@example.com"]
   [app] →
   id | requester_email | title         
   ---+-----------------+---------------
   1  | an@example.com  | Xin cấp laptop
   (1 dòng)

## 3. Prepared statement: một câu lệnh, nhiều giá trị
[app]    63ms  prepare by_email (text) as select id, title from requests where requester_email = $1
   [app] → PREPARE
[app]    63ms  execute by_email('chi@example.com')
   [app] →
   id | title        
   ---+--------------
   3  | Xin nghỉ phép
   (1 dòng)
[app]    64ms  execute by_email('binh@example.com')
   [app] →
   id | title               
   ---+---------------------
   2  | Lương tháng 9 bị sai
   (1 dòng)
[app]    64ms  select name, statement, parameter_types, from_sql from pg_prepared_statements order by name
   [app] →
   name     | statement                                                                            | parameter_types | from_sql
   ---------+--------------------------------------------------------------------------------------+-----------------+---------
   by_email | prepare by_email (text) as select id, title from requests where requester_email = $1 | {text}          | true    
   (1 dòng)
-- Hai truy vấn dùng $1 ở bước 2 không có name nên không nằm trong danh sách.

## 4. Truy vấn có name: node-postgres tạo prepared statement có tên ở phía máy chủ
[app] client.query({ name: 'by_email_named', text: 'select id, title from requests where requester_email = $1', values: ["an@example.com"] })
   [app] → 1 dòng
[app] client.query({ name: 'by_email_named', text: 'select id, title from requests where requester_email = $1', values: ["chi@example.com"] })
   [app] → 1 dòng
[app]    66ms  select name, statement, parameter_types, from_sql from pg_prepared_statements order by name
   [app] →
   name           | statement                                                                            | parameter_types | from_sql
   ---------------+--------------------------------------------------------------------------------------+-----------------+---------
   by_email       | prepare by_email (text) as select id, title from requests where requester_email = $1 | {text}          | true    
   by_email_named | select id, title from requests where requester_email = $1                            | {text}          | false   
   (2 dòng)
-- from_sql = false: câu do giao thức tạo (Parse có tên), không phải lệnh PREPARE trong SQL.
```
