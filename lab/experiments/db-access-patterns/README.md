# Thử nghiệm: db-access-patterns

**Câu hỏi.** Truy vấn lấy 20 yêu cầu mới nhất của một người gửi. Index nào phục vụ truy vấn này tốt nhất, và thứ tự cột, INCLUDE, partial index thay đổi gì? Partial index có được dùng khi điều kiện truyền qua tham số không?

**Môi trường.** PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2) trong container `postgres:16` của lab, Docker Desktop trên máy Lam (Windows 11; Docker báo 16 CPU, 15,5 GB RAM; `shared_buffers = 128MB`, `max_parallel_workers_per_gather = 2`, collation của database `en_US.utf8`); client Node.js v25.2.1 với driver `pg` 8.16.3. Chạy ngày 02/11/2026. Lần chạy ngày 16/10/2026 trong môi trường build Linux của Claude (PostgreSQL 16.15 gói Ubuntu) cho cùng số trang và cùng kế hoạch; lần này chạy lại vì đổi chữ trong các dòng ghi chú của script. Dữ liệu sinh bằng `lab/lib/requests-1m.mjs`: 1.000.000 yêu cầu, 5.000 người gửi (mỗi người 200 yêu cầu), 5% pending, 20% rejected, 75% approved.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc PostgreSQL 16 có sẵn: đặt PGPORT (và PGUSER, PGPASSWORD, PGDATABASE nếu khác lab) cho khớp
npm install
node experiments/db-access-patterns/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- Chỉ có index trên `created_at`: `Index Scan Backward` rồi lọc người gửi, loại 96.774 dòng trước khi đủ 20, đọc 1.621 trang.
- Chỉ có index trên `requester_id`: lấy cả 200 yêu cầu của người đó (`Heap Blocks: exact=200`) rồi `top-N heapsort`, đọc 203 trang.
- Index ghép `(requester_id, created_at)`: `Index Scan Backward` với `Index Cond: (requester_id = 1234)`, đọc đúng 20 dòng, 23 trang.
- Chỉ lọc theo `created_at` (một ngày, 1.440 dòng) khi chỉ có index ghép `(requester_id, created_at)`: planner dùng `Parallel Seq Scan`, đọc 11.236 trang.
- Covering index `(requester_id, created_at) include (id, status)`: `Index Only Scan Backward`. Trước VACUUM: `Heap Fetches: 20`, 23 trang. Sau VACUUM: `Heap Fetches: 0`, 4 trang.
- Truy vấn 20 yêu cầu pending mới nhất: partial index `(created_at) where status = 'pending'` chiếm 1.112 kB, so với 38 MB của index đầy đủ `(status, created_at)`; planner chọn partial index, đọc 7 trang.
- Câu lệnh prepared `where status = $1`, chạy với `'pending'`: với `plan_cache_mode = force_custom_plan`, kế hoạch dùng partial index `ap_pending_created`; với `force_generic_plan`, kế hoạch dùng `ap_status_created` với `Index Cond: (status = $1)`, không dùng partial index.

**Giới hạn của kết luận.**

- Mỗi bước tạo hoặc xóa index rồi `analyze`; planner được chọn giữa các index đang có ở bước đó.
- Chỉ đo số trang và thời gian của một lần chạy; không đo chi phí ghi của từng thiết kế (xem lab `db-index-basics`).
- Dữ liệu có `created_at` trùng thứ tự vật lý của bảng; bảng thật có thứ tự khác sẽ cho số trang khác.
- Bước 7 ép từng chế độ bằng `plan_cache_mode`; với mặc định `auto`, PostgreSQL 16 dùng custom plan cho 5 lần chạy đầu rồi mới cân nhắc generic plan, nên cùng câu lệnh có thể đổi kế hoạch sau vài lần chạy.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Mô hình truy vấn và thiết kế index trên PostgreSQL
Máy chủ: PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2) on x86_64-pc-linux-gnu, compiled by gcc (Debian 14.2.0-19) 14.2.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v25.2.1, driver pg 8.16.3
Thời điểm chạy: 2026-11-02T02:52:52.455Z
[app]    47ms  drop schema if exists exp_ap cascade
[app]    49ms  NOTICE: schema "exp_ap" does not exist, skipping
   [app] → DROP
[app]    49ms  create schema exp_ap
   [app] → CREATE
[app]    53ms  set search_path = exp_ap, public
   [app] → SET
[app]    54ms  create table requests ( id bigint primary key, requester_id integer not null, department_id integer not null, status text not null, created_at timestamptz not null, title text not null)
   [app] → CREATE
[app]    78ms  insert into requests select g, 1 + (g::bigint * 7919) % 5000, 1 + ((g::bigint * 7919) % 5000) % 20, case when (g + g / 5000) % 20 = 0 then 'pending' when (g + g / 5000) % 4 = 0 then 'rejected' else 'approved' end, timestamptz '2024-01-01 00:00+07' + g * interval '1 minute', 'Yêu cầu số ' || g from generate_series(1, 1000000) g
   [app] → INSERT 1000000
[app]  1701ms  select count(*) as so_dong, count(distinct requester_id) as so_nguoi_gui, round(100.0 * count(*) filter (where status = 'pending') / count(*), 1) as pct_pending, round(100.0 * count(*) filter (where status = 'approved') / count(*), 1) as pct_approved, pg_size_pretty(pg_relation_size('requests')) as kich_thuoc_bang from requests
   [app] →
   so_dong | so_nguoi_gui | pct_pending | pct_approved | kich_thuoc_bang
   --------+--------------+-------------+--------------+----------------
   1000000 | 5000         | 5.0         | 75.0         | 88 MB          
   (1 dòng)
[app]  2172ms  analyze requests
   [app] → ANALYZE
-- Truy vấn: 20 yêu cầu mới nhất của một người gửi.

## 1. Chỉ có index trên created_at
[app]  2413ms  create index ap_created on requests (created_at)
   [app] → CREATE
[app]  2635ms  analyze requests
   [app] → ANALYZE
[app]  2885ms  explain (analyze, buffers, costs off, timing off) select id, status, created_at from requests where requester_id = 1234 order by created_at desc limit 20
   [app] →
   QUERY PLAN                                                                     
   -------------------------------------------------------------------------------
   Limit (actual rows=20 loops=1)                                                 
     Buffers: shared hit=1621                                                     
     ->  Index Scan Backward using ap_created on requests (actual rows=20 loops=1)
           Filter: (requester_id = 1234)                                          
           Rows Removed by Filter: 96774                                          
           Buffers: shared hit=1621                                               
   Planning Time: 0.051 ms                                                        
   Execution Time: 4.838 ms                                                       
   (8 dòng)

## 2. Chỉ có index trên requester_id
[app]  2892ms  drop index ap_created
   [app] → DROP
[app]  2899ms  create index ap_requester on requests (requester_id)
   [app] → CREATE
[app]  3139ms  analyze requests
   [app] → ANALYZE
[app]  3376ms  explain (analyze, buffers, costs off, timing off) select id, status, created_at from requests where requester_id = 1234 order by created_at desc limit 20
   [app] →
   QUERY PLAN                                                                   
   -----------------------------------------------------------------------------
   Limit (actual rows=20 loops=1)                                               
     Buffers: shared hit=203                                                    
     ->  Sort (actual rows=20 loops=1)                                          
           Sort Key: created_at DESC                                            
           Sort Method: top-N heapsort  Memory: 27kB                            
           Buffers: shared hit=203                                              
           ->  Bitmap Heap Scan on requests (actual rows=200 loops=1)           
                 Recheck Cond: (requester_id = 1234)                            
                 Heap Blocks: exact=200                                         
                 Buffers: shared hit=203                                        
                 ->  Bitmap Index Scan on ap_requester (actual rows=200 loops=1)
                       Index Cond: (requester_id = 1234)                        
                       Buffers: shared hit=3                                    
   Planning Time: 0.034 ms                                                      
   Execution Time: 0.204 ms                                                     
   (15 dòng)

## 3. Index ghép (requester_id, created_at)
[app]  3377ms  drop index ap_requester
   [app] → DROP
[app]  3381ms  create index ap_req_created on requests (requester_id, created_at)
   [app] → CREATE
[app]  3741ms  analyze requests
   [app] → ANALYZE
[app]  3980ms  explain (analyze, buffers, costs off, timing off) select id, status, created_at from requests where requester_id = 1234 order by created_at desc limit 20
   [app] →
   QUERY PLAN                                                                         
   -----------------------------------------------------------------------------------
   Limit (actual rows=20 loops=1)                                                     
     Buffers: shared hit=23                                                           
     ->  Index Scan Backward using ap_req_created on requests (actual rows=20 loops=1)
           Index Cond: (requester_id = 1234)                                          
           Buffers: shared hit=23                                                     
   Planning Time: 0.057 ms                                                            
   Execution Time: 0.046 ms                                                           
   (7 dòng)

## 4. Truy vấn chỉ lọc theo cột thứ hai của index ghép
[app]  4018ms  explain (analyze, buffers, costs off, timing off) select count(*) from requests where created_at >= timestamptz '2025-11-01 00:00+07' and created_at < timestamptz '2025-11-02 00:00+07'
   [app] →
   QUERY PLAN                                                                                                                                                            
   ----------------------------------------------------------------------------------------------------------------------------------------------------------------------
   Finalize Aggregate (actual rows=1 loops=1)                                                                                                                            
     Buffers: shared hit=11236                                                                                                                                           
     ->  Gather (actual rows=3 loops=1)                                                                                                                                  
           Workers Planned: 2                                                                                                                                            
           Workers Launched: 2                                                                                                                                           
           Buffers: shared hit=11236                                                                                                                                     
           ->  Partial Aggregate (actual rows=1 loops=3)                                                                                                                 
                 Buffers: shared hit=11236                                                                                                                               
                 ->  Parallel Seq Scan on requests (actual rows=480 loops=3)                                                                                             
                       Filter: ((created_at >= '2025-10-31 17:00:00+00'::timestamp with time zone) AND (created_at < '2025-11-01 17:00:00+00'::timestamp with time zone))
                       Rows Removed by Filter: 332853                                                                                                                    
                       Buffers: shared hit=11236                                                                                                                         
   Planning Time: 0.059 ms                                                                                                                                               
   Execution Time: 27.210 ms                                                                                                                                             
   (14 dòng)
-- created_at không phải cột dẫn đầu của ap_req_created, nên index không giới hạn được phần cần quét.

## 5. Covering index: thêm id và status vào index bằng INCLUDE
[app]  4047ms  create index ap_req_created_cover on requests (requester_id, created_at) include (id, status)
   [app] → CREATE
[app]  4535ms  drop index ap_req_created
   [app] → DROP
[app]  4542ms  analyze requests
   [app] → ANALYZE
[app]  4801ms  explain (analyze, buffers, costs off, timing off) select id, status, created_at from requests where requester_id = 1234 order by created_at desc limit 20
   [app] →
   QUERY PLAN                                                                                    
   ----------------------------------------------------------------------------------------------
   Limit (actual rows=20 loops=1)                                                                
     Buffers: shared hit=23                                                                      
     ->  Index Only Scan Backward using ap_req_created_cover on requests (actual rows=20 loops=1)
           Index Cond: (requester_id = 1234)                                                     
           Heap Fetches: 20                                                                      
           Buffers: shared hit=23                                                                
   Planning Time: 0.038 ms                                                                       
   Execution Time: 0.030 ms                                                                      
   (8 dòng)
-- Bảng chưa được VACUUM nên visibility map chưa đánh dấu trang nào all-visible.
[app]  4803ms  vacuum requests
   [app] → VACUUM
[app]  4856ms  explain (analyze, buffers, costs off, timing off) select id, status, created_at from requests where requester_id = 1234 order by created_at desc limit 20
   [app] →
   QUERY PLAN                                                                                    
   ----------------------------------------------------------------------------------------------
   Limit (actual rows=20 loops=1)                                                                
     Buffers: shared hit=4                                                                       
     ->  Index Only Scan Backward using ap_req_created_cover on requests (actual rows=20 loops=1)
           Index Cond: (requester_id = 1234)                                                     
           Heap Fetches: 0                                                                       
           Buffers: shared hit=4                                                                 
   Planning Time: 0.043 ms                                                                       
   Execution Time: 0.018 ms                                                                      
   (8 dòng)

## 6. Partial index cho truy vấn yêu cầu pending
[app]  4858ms  create index ap_status_created on requests (status, created_at)
   [app] → CREATE
[app]  5470ms  create index ap_pending_created on requests (created_at) where status = 'pending'
   [app] → CREATE
[app]  5524ms  select relname, pg_size_pretty(pg_relation_size(oid)) as kich_thuoc from pg_class where relname in ('ap_status_created', 'ap_pending_created') and relnamespace = 'exp_ap'::regnamespace order by relname
   [app] →
   relname            | kich_thuoc
   -------------------+-----------
   ap_pending_created | 1112 kB   
   ap_status_created  | 38 MB     
   (2 dòng)
[app]  5526ms  analyze requests
   [app] → ANALYZE
[app]  5776ms  explain (analyze, buffers, costs off, timing off) select id, requester_id, created_at from requests where status = 'pending' order by created_at desc limit 20
   [app] →
   QUERY PLAN                                                                             
   ---------------------------------------------------------------------------------------
   Limit (actual rows=20 loops=1)                                                         
     Buffers: shared hit=7                                                                
     ->  Index Scan Backward using ap_pending_created on requests (actual rows=20 loops=1)
           Buffers: shared hit=7                                                          
   Planning Time: 0.053 ms                                                                
   Execution Time: 0.016 ms                                                               
   (6 dòng)

## 7. Partial index với câu lệnh có tham số: custom plan và generic plan
[app]  5777ms  prepare pending_list(text) as select id, requester_id, created_at from requests where status = $1 order by created_at desc limit 20
   [app] → PREPARE
[app]  5778ms  set plan_cache_mode = force_custom_plan
   [app] → SET
[app]  5778ms  explain (costs off) execute pending_list('pending')
   [app] →
   QUERY PLAN                                                    
   --------------------------------------------------------------
   Limit                                                         
     ->  Index Scan Backward using ap_pending_created on requests
   (2 dòng)
[app]  5779ms  set plan_cache_mode = force_generic_plan
   [app] → SET
[app]  5780ms  explain (costs off) execute pending_list('pending')
   [app] →
   QUERY PLAN                                                   
   -------------------------------------------------------------
   Limit                                                        
     ->  Index Scan Backward using ap_status_created on requests
           Index Cond: (status = $1)                            
   (3 dòng)
-- Generic plan được lập một lần cho mọi giá trị của $1, nên không thể dựa vào việc $1 là pending để chọn partial index.
[app]  5780ms  reset plan_cache_mode
   [app] → RESET
```
