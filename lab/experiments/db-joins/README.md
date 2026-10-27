# Thử nghiệm: db-joins

**Câu hỏi.** Inner join và left join giữ những dòng nào? Điều kiện trên bảng bên phải đặt ở `ON` hay `WHERE` khác nhau ra sao? Join nhiều bảng làm sai phép đếm thế nào, và planner chọn thuật toán join nào?

**Môi trường.** PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), cài sẵn trong môi trường build Linux của Claude; client Node.js v22.22.0 với driver `pg` 8.16.3. Chạy ngày 15/10/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc dùng PostgreSQL 16 có sẵn
npm install
node experiments/db-joins/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- Inner join giữa 4 người dùng và 5 yêu cầu trả về 5 dòng; Chi (không có yêu cầu) không xuất hiện.
- Left join trả về 6 dòng; Chi có một dòng với `request_id` và `status` là `NULL`.
- Đặt `r.status = 'pending'` ở `WHERE`: còn 2 dòng (An, Dũng), mất Bình và Chi. Đặt cùng điều kiện ở `ON`: đủ 4 người dùng, Bình và Chi có `pending = 0`.
- Đếm người dùng mỗi phòng: không join requests thì Nhân sự 1, Kỹ thuật 2, Kế toán 0. Join thêm requests thì `count(u.id)` ra 2 và 3 (đếm trùng), còn `count(distinct u.id)` vẫn ra 1 và 2.
- Viết `from departments d, users u` mà không có điều kiện nối: 12 dòng, tức 3 × 4. Viết `departments d join users u` thiếu `ON`: PostgreSQL 16.15 báo `42601: syntax error at end of input`.
- Với 5.000 người dùng và 200.000 yêu cầu, join toàn bộ dùng `Hash Join` (bảng băm dựng từ `users`, 5.000 dòng); thêm `where u.id = 7` thì dùng `Nested Loop`: `Index Scan` trên `users_pkey` rồi `Bitmap Index Scan` trên `requests_requester_idx`, ra 40 dòng.

**Giới hạn của kết luận.**

- Kế hoạch thực thi phụ thuộc dữ liệu, thống kê và cấu hình; kết quả chỉ áp dụng cho dữ liệu và PostgreSQL 16.15 ở đây.
- Dùng `timing off` nên không đo thời gian; thử nghiệm không so sánh tốc độ giữa các thuật toán join.
- Không chạy trên Oracle.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Join trên PostgreSQL
Máy chủ: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v22.22.0, driver pg 8.16.3
Thời điểm chạy: 2026-10-15T03:08:27.782Z
[app]    41ms  drop schema if exists exp_join cascade
[app]    43ms  NOTICE: drop cascades to 3 other objects
   DETAIL: drop cascades to table exp_join.departments
drop cascades to table exp_join.users
drop cascades to table exp_join.requests
   [app] → DROP
[app]    65ms  create schema exp_join
   [app] → CREATE
[app]    66ms  set search_path = exp_join
   [app] → SET
[app]    66ms  create table departments (id integer primary key, name text not null)
   [app] → CREATE
[app]    70ms  create table users (id integer primary key, full_name text not null, department_id integer references departments)
   [app] → CREATE
[app]    73ms  create table requests (id integer primary key, requester_id integer not null references users, status text not null)
   [app] → CREATE
[app]    75ms  insert into departments values (1, 'Nhân sự'), (2, 'Kỹ thuật'), (3, 'Kế toán')
   [app] → INSERT 3
[app]    76ms  insert into users values (1, 'An', 1), (2, 'Bình', 2), (3, 'Chi', 2), (4, 'Dũng', null)
   [app] → INSERT 4
[app]    78ms  insert into requests values (1, 1, 'pending'), (2, 1, 'approved'), (3, 2, 'approved'), (4, 2, 'approved'), (5, 4, 'pending')
   [app] → INSERT 5
-- Chi không có yêu cầu nào; Dũng chưa thuộc phòng ban nào; phòng Kế toán chưa có ai.

## 1. Inner join: chỉ giữ người dùng có ít nhất một yêu cầu
[app]    79ms  select u.full_name, r.id as request_id, r.status from users u join requests r on r.requester_id = u.id order by u.id, r.id
   [app] →
   full_name | request_id | status  
   ----------+------------+---------
   An        | 1          | pending 
   An        | 2          | approved
   Bình      | 3          | approved
   Bình      | 4          | approved
   Dũng      | 5          | pending 
   (5 dòng)

## 2. Left join: giữ mọi người dùng, cột của requests là NULL khi không khớp
[app]    80ms  select u.full_name, r.id as request_id, r.status from users u left join requests r on r.requester_id = u.id order by u.id, r.id
   [app] →
   full_name | request_id | status  
   ----------+------------+---------
   An        | 1          | pending 
   An        | 2          | approved
   Bình      | 3          | approved
   Bình      | 4          | approved
   Chi       | NULL       | NULL    
   Dũng      | 5          | pending 
   (6 dòng)

## 3. Điều kiện trên bảng bên phải: đặt ở WHERE so với đặt ở ON
[app]    81ms  select u.full_name, count(r.id) as pending from users u left join requests r on r.requester_id = u.id where r.status = 'pending' group by u.id, u.full_name order by u.id
   [app] →
   full_name | pending
   ----------+--------
   An        | 1      
   Dũng      | 1      
   (2 dòng)
[app]    82ms  select u.full_name, count(r.id) as pending from users u left join requests r on r.requester_id = u.id and r.status = 'pending' group by u.id, u.full_name order by u.id
   [app] →
   full_name | pending
   ----------+--------
   An        | 1      
   Bình      | 0      
   Chi       | 0      
   Dũng      | 1      
   (4 dòng)
-- Đặt ở WHERE: lọc sau khi join, nên mất người không có yêu cầu pending. Đặt ở ON: lọc trước khi join, mọi người dùng còn lại với số 0.

## 4. Nhân dòng: đếm người dùng của mỗi phòng sau khi join thêm requests
[app]    83ms  select d.name, count(u.id) as so_nguoi from departments d left join users u on u.department_id = d.id group by d.id, d.name order by d.id
   [app] →
   name     | so_nguoi
   ---------+---------
   Nhân sự  | 1       
   Kỹ thuật | 2       
   Kế toán  | 0       
   (3 dòng)
[app]    83ms  select d.name, count(u.id) as so_nguoi_sai, count(distinct u.id) as so_nguoi_dung from departments d left join users u on u.department_id = d.id left join requests r on r.requester_id = u.id group by d.id, d.name order by d.id
   [app] →
   name     | so_nguoi_sai | so_nguoi_dung
   ---------+--------------+--------------
   Nhân sự  | 2            | 1            
   Kỹ thuật | 3            | 2            
   Kế toán  | 0            | 0            
   (3 dòng)
-- Mỗi người dùng xuất hiện một lần cho mỗi yêu cầu của họ, nên count(u.id) đếm trùng.

## 5. Quên điều kiện nối
[app]    84ms  select count(*) as so_dong from departments d, users u
   [app] →
   so_dong
   -------
   12     
   (1 dòng)
-- FROM viết bằng dấu phẩy mà không có điều kiện nối: 3 phòng ban × 4 người dùng = 12 dòng.
[app]    84ms  select d.name, u.full_name from departments d join users u
[app]    84ms  LỖI 42601: syntax error at end of input
-- Với cú pháp JOIN, thiếu ON thì PostgreSQL báo lỗi cú pháp thay vì trả về tích Descartes.

## 6. Thuật toán join: dữ liệu lớn hơn, có và không có điều kiện chọn một người
[app]    84ms  insert into users select g, 'User ' || g, 1 + g % 3 from generate_series(5, 5000) g
   [app] → INSERT 4996
[app]   116ms  insert into requests select g, 1 + g % 5000, case when g % 4 = 0 then 'pending' else 'approved' end from generate_series(6, 200000) g
   [app] → INSERT 199995
[app]  1453ms  create index requests_requester_idx on requests (requester_id)
   [app] → CREATE
[app]  1511ms  analyze
   [app] → ANALYZE
[app]  1641ms  explain (analyze, costs off, timing off, summary off) select u.full_name, r.status from users u join requests r on r.requester_id = u.id
   [app] →
   QUERY PLAN                                                
   ----------------------------------------------------------
   Hash Join (actual rows=200000 loops=1)                    
     Hash Cond: (r.requester_id = u.id)                      
     ->  Seq Scan on requests r (actual rows=200000 loops=1) 
     ->  Hash (actual rows=5000 loops=1)                     
           Buckets: 8192  Batches: 1  Memory Usage: 298kB    
           ->  Seq Scan on users u (actual rows=5000 loops=1)
   (6 dòng)
[app]  1674ms  explain (analyze, costs off, timing off, summary off) select u.full_name, r.status from users u join requests r on r.requester_id = u.id where u.id = 7
   [app] →
   QUERY PLAN                                                                      
   --------------------------------------------------------------------------------
   Nested Loop (actual rows=40 loops=1)                                            
     ->  Index Scan using users_pkey on users u (actual rows=1 loops=1)            
           Index Cond: (id = 7)                                                    
     ->  Bitmap Heap Scan on requests r (actual rows=40 loops=1)                   
           Recheck Cond: (requester_id = 7)                                        
           Heap Blocks: exact=40                                                   
           ->  Bitmap Index Scan on requests_requester_idx (actual rows=40 loops=1)
                 Index Cond: (requester_id = 7)                                    
   (8 dòng)
-- Join cả hai bảng: planner chọn hash join. Chỉ một người dùng: planner chọn nested loop dùng index của requests.
```
