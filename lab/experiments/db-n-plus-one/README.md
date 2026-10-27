# Thử nghiệm: db-n-plus-one

**Câu hỏi.** Lấy 50 yêu cầu mới nhất kèm tên người gửi: N+1, `IN` và `JOIN` khác nhau bao nhiêu truy vấn và thời gian?

**Môi trường.** PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), cài sẵn trong môi trường build Linux của Claude; client Node.js v22.22.0 với driver `pg` 8.16.3. Chạy ngày 14/10/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc dùng PostgreSQL 16 có sẵn
npm install
node experiments/db-n-plus-one/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- N+1 chạy 51 truy vấn mỗi lần tải 50 yêu cầu; `IN` chạy 2; `JOIN` chạy 1.
- Chưa có index trên `created_at` (trung bình 20 vòng sau 1 vòng khởi động): N+1 20,23 ms, `IN` 5,08 ms, `JOIN` 12,34 ms. Cả câu đầu của `IN` lẫn `JOIN` đều quét toàn bộ 20.000 dòng `requests`; `JOIN` còn hash join 20.000 dòng trước khi sắp xếp top-N.
- Sau khi thêm index: kế hoạch của `JOIN` chuyển sang `Index Scan Backward` + `Nested Loop` (có `Memoize`) trên đúng 50 dòng; N+1 15,21 ms, `IN` 0,79 ms, `JOIN` 0,94 ms.

**Giới hạn của kết luận.**

- Một lần chạy trên localhost với PostgreSQL 16.15, dữ liệu 500 người dùng và 20.000 yêu cầu; số thời gian thay đổi giữa các lần chạy, hãy so sánh tỷ lệ, không so số tuyệt đối.
- Qua mạng, mỗi truy vấn còn thêm một vòng đi-về; phần này không được đo.
- Không đo `IN` và `JOIN` với dữ liệu khác hoặc trang lớn hơn 50 dòng.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Vấn đề N+1
Máy chủ: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v22.22.0, driver pg 8.16.3
Thời điểm chạy: 2026-10-14T07:18:55.038Z
[app]    61ms  drop schema if exists exp_n1 cascade
[app]    63ms  NOTICE: drop cascades to 2 other objects
   DETAIL: drop cascades to table exp_n1.users
drop cascades to table exp_n1.requests
   [app] → DROP
[app]    69ms  create schema exp_n1
   [app] → CREATE
[app]    71ms  set search_path = exp_n1
   [app] → SET
[app]    71ms  create table users (id integer primary key, full_name text not null)
   [app] → CREATE
[app]    76ms  create table requests (id integer primary key, requester_id integer not null references users, title text not null, created_at timestamptz not null)
   [app] → CREATE
[app]    80ms  insert into users select g, 'Nhân viên ' || g from generate_series(1, 500) g
   [app] → INSERT 500
[app]    83ms  insert into requests select g, 1 + (g % 500), 'Yêu cầu ' || g, now() - (g || ' minutes')::interval from generate_series(1, 20000) g
   [app] → INSERT 20000
[app]   342ms  analyze
   [app] → ANALYZE

## 1. Ba cách lấy 50 yêu cầu mới nhất kèm tên người gửi, chưa có index trên created_at (đo 20 lần)
-- N+1: 51 truy vấn, trung bình 20.23 ms mỗi lần tải trang
-- IN (2 truy vấn): 2 truy vấn, trung bình 5.08 ms mỗi lần tải trang
-- JOIN (1 truy vấn): 1 truy vấn, trung bình 12.34 ms mỗi lần tải trang
-- N+1 chậm hơn JOIN khoảng 1.6 lần ngay trên localhost.
[app]  1285ms  explain (analyze, costs off, timing off, summary off) select id, requester_id, title from requests order by created_at desc limit 50
   [app] →
   QUERY PLAN                                                  
   ------------------------------------------------------------
   Limit (actual rows=50 loops=1)                              
     ->  Sort (actual rows=50 loops=1)                         
           Sort Key: created_at DESC                           
           Sort Method: top-N heapsort  Memory: 28kB           
           ->  Seq Scan on requests (actual rows=20000 loops=1)
   (5 dòng)
[app]  1289ms  explain (analyze, costs off, timing off, summary off) select r.id, r.title, u.full_name from requests r join users u on u.id = r.requester_id order by r.created_at desc limit 50
   [app] →
   QUERY PLAN                                                           
   ---------------------------------------------------------------------
   Limit (actual rows=50 loops=1)                                       
     ->  Sort (actual rows=50 loops=1)                                  
           Sort Key: r.created_at DESC                                  
           Sort Method: top-N heapsort  Memory: 28kB                    
           ->  Hash Join (actual rows=20000 loops=1)                    
                 Hash Cond: (r.requester_id = u.id)                     
                 ->  Seq Scan on requests r (actual rows=20000 loops=1) 
                 ->  Hash (actual rows=500 loops=1)                     
                       Buckets: 1024  Batches: 1  Memory Usage: 34kB    
                       ->  Seq Scan on users u (actual rows=500 loops=1)
   (10 dòng)
-- Không có index cho order by created_at, JOIN phải nối và sắp xếp trên cả bảng trước khi lấy 50 dòng.

## 2. Thêm index trên created_at rồi đo lại
[app]  1302ms  create index requests_created_at_idx on requests (created_at)
   [app] → CREATE
[app]  1318ms  analyze requests
   [app] → ANALYZE
-- N+1: 51 truy vấn, trung bình 15.21 ms mỗi lần tải trang
-- IN (2 truy vấn): 2 truy vấn, trung bình 0.79 ms mỗi lần tải trang
-- JOIN (1 truy vấn): 1 truy vấn, trung bình 0.94 ms mỗi lần tải trang
[app]  1711ms  explain (analyze, costs off, timing off, summary off) select r.id, r.title, u.full_name from requests r join users u on u.id = r.requester_id order by r.created_at desc limit 50
   [app] →
   QUERY PLAN                                                                                          
   ----------------------------------------------------------------------------------------------------
   Limit (actual rows=50 loops=1)                                                                      
     ->  Nested Loop (actual rows=50 loops=1)                                                          
           ->  Index Scan Backward using requests_created_at_idx on requests r (actual rows=50 loops=1)
           ->  Memoize (actual rows=1 loops=50)                                                        
                 Cache Key: r.requester_id                                                             
                 Cache Mode: logical                                                                   
                 Hits: 0  Misses: 50  Evictions: 0  Overflows: 0  Memory Usage: 6kB                    
                 ->  Index Scan using users_pkey on users u (actual rows=1 loops=50)                   
                       Index Cond: (id = r.requester_id)                                               
   (9 dòng)
-- Sau khi có index: N+1 chậm hơn JOIN khoảng 16.2 lần.
-- Thử nghiệm chạy trên localhost. Qua mạng, mỗi truy vấn còn thêm một vòng đi-về giữa ứng dụng và database; phần này không được đo ở đây.
```
