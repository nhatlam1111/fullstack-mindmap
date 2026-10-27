# Thử nghiệm: db-btree

**Câu hỏi.** Index B-tree của 1 triệu khóa có bao nhiêu tầng và trang? Tìm một khóa đi qua mấy trang? Deduplication tiết kiệm bao nhiêu? Khi nào LIKE dùng được index?

**Môi trường.** PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), cài sẵn trong môi trường build Linux của Claude (2 nhân CPU, 8 GB RAM, `shared_buffers = 128MB`, `max_parallel_workers_per_gather = 2`, collation của database `C.UTF-8`); client Node.js v22.22.0 với driver `pg` 8.16.3. Chạy ngày 16/10/2026. Dữ liệu sinh bằng `lab/lib/requests-1m.mjs`: 1.000.000 yêu cầu, 5.000 người gửi (mỗi người 200 yêu cầu), 5% pending, 20% rejected, 75% approved.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc dùng PostgreSQL 16 có sẵn
npm install
node experiments/db-btree/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- `bt_metap` của `requests_pkey`: `level = 2`, gốc ở block 412. Đếm bằng `bt_page_stats`: tầng 2 có 1 trang (gốc, 10 mục), tầng 1 có 10 trang trong (2.742 mục), tầng 0 có 2.733 trang lá. Trang lá chiếm 99,60% số trang.
- Tổng `live_items` ở tầng lá là 1.002.732: 1.000.000 khóa cộng 2.732 high key, mỗi trang lá không nằm ở mép phải có một high key.
- `where id = 777777`: `Index Scan`, `shared hit=4`, tức 3 trang index (gốc, trong, lá) và 1 trang bảng.
- `id between 500000 and 500099`: `Index Only Scan` với điều kiện `>=` và `<=`, 100 dòng, 6 trang; `Heap Fetches: 100` vì bảng chưa được VACUUM. `order by id desc limit 5`: `Index Only Scan Backward`, 4 trang.
- Index trên `status` (3 giá trị): có deduplication (mặc định) chiếm 6.904 kB (863 trang); với `deduplicate_items = off` chiếm 30 MB (3.803 trang).
- Database có collation `C.UTF-8`. Với index mặc định trên `title`, `like 'Yêu cầu số 12345%'` dùng `Parallel Seq Scan`, còn `=` dùng `Index Scan`. Sau khi tạo index với `text_pattern_ops`, cùng câu `like` dùng `Index Scan` với điều kiện `~>=~ 'Yêu cầu số 12345'` và `~<~ 'Yêu cầu số 12346'`.

**Giới hạn của kết luận.**

- Số tầng và số trang phụ thuộc kiểu và độ dài khóa (`bigint` ở đây) và cách index được tạo (dựng một lần từ bảng đã có dữ liệu); index tăng dần qua nhiều lần chèn có thể khác.
- `pageinspect` chỉ superuser dùng được; không chạy trên database production.
- Kết quả LIKE là quan sát trên PostgreSQL 16.15 với collation `C.UTF-8` của provider libc; database dùng collation khác có thể cho kết quả khác.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# B-tree trên PostgreSQL
Máy chủ: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v22.22.0, driver pg 8.16.3
Thời điểm chạy: 2026-10-16T07:03:43.785Z
[app]    40ms  drop schema if exists exp_bt cascade
[app]    41ms  NOTICE: schema "exp_bt" does not exist, skipping
   [app] → DROP
[app]    41ms  create schema exp_bt
   [app] → CREATE
[app]    43ms  set search_path = exp_bt, public
   [app] → SET
[app]    44ms  create table requests ( id bigint primary key, requester_id integer not null, department_id integer not null, status text not null, created_at timestamptz not null, title text not null)
   [app] → CREATE
[app]    49ms  insert into requests select g, 1 + (g::bigint * 7919) % 5000, 1 + ((g::bigint * 7919) % 5000) % 20, case when (g + g / 5000) % 20 = 0 then 'pending' when (g + g / 5000) % 4 = 0 then 'rejected' else 'approved' end, timestamptz '2024-01-01 00:00+07' + g * interval '1 minute', 'Yêu cầu số ' || g from generate_series(1, 1000000) g
   [app] → INSERT 1000000
[app]  2740ms  select count(*) as so_dong, count(distinct requester_id) as so_nguoi_gui, round(100.0 * count(*) filter (where status = 'pending') / count(*), 1) as pct_pending, round(100.0 * count(*) filter (where status = 'approved') / count(*), 1) as pct_approved, pg_size_pretty(pg_relation_size('requests')) as kich_thuoc_bang from requests
   [app] →
   so_dong | so_nguoi_gui | pct_pending | pct_approved | kich_thuoc_bang
   --------+--------------+-------------+--------------+----------------
   1000000 | 5000         | 5.0         | 75.0         | 88 MB          
   (1 dòng)
[app]  3230ms  create extension if not exists pageinspect
   [app] → CREATE
[app]  3242ms  analyze requests
   [app] → ANALYZE

## 1. Cấu trúc của index khóa chính (1 triệu dòng)
[app]  3373ms  select root, level, fastroot, fastlevel from bt_metap('exp_bt.requests_pkey')
   [app] →
   root | level | fastroot | fastlevel
   -----+-------+----------+----------
   412  | 2     | 412      | 2        
   (1 dòng)
-- level là số tầng phía trên tầng lá; root là số block của trang gốc.
[app]  3374ms  select p.btpo_level as tang, case when p.btpo_level = 0 then 'lá' else 'trong' end as loai, count(*) as so_trang, sum(p.live_items) as so_muc from generate_series(1, pg_relation_size('exp_bt.requests_pkey') / current_setting('block_size')::int - 1) blk, lateral bt_page_stats('exp_bt.requests_pkey', blk) p group by p.btpo_level order by p.btpo_level desc
   [app] →
   tang | loai  | so_trang | so_muc 
   -----+-------+----------+--------
   2    | trong | 1        | 10     
   1    | trong | 10       | 2742   
   0    | lá    | 2733     | 1002732
   (3 dòng)
[app]  3392ms  select round(100.0 * count(*) filter (where p.btpo_level = 0) / count(*), 2) as pct_trang_la from generate_series(1, pg_relation_size('exp_bt.requests_pkey') / current_setting('block_size')::int - 1) blk, lateral bt_page_stats('exp_bt.requests_pkey', blk) p
   [app] →
   pct_trang_la
   ------------
   99.60       
   (1 dòng)

## 2. Tìm một khóa: đi từ gốc xuống lá rồi đọc một trang của bảng
[app]  3410ms  explain (analyze, buffers, costs off, timing off, summary off) select id, status from requests where id = 777777
   [app] →
   QUERY PLAN                                                        
   ------------------------------------------------------------------
   Index Scan using requests_pkey on requests (actual rows=1 loops=1)
     Index Cond: (id = 777777)                                       
     Buffers: shared hit=4                                           
   (3 dòng)

## 3. Quét theo khoảng và quét ngược
[app]  3411ms  explain (analyze, buffers, costs off, timing off, summary off) select id from requests where id between 500000 and 500099
   [app] →
   QUERY PLAN                                                               
   -------------------------------------------------------------------------
   Index Only Scan using requests_pkey on requests (actual rows=100 loops=1)
     Index Cond: ((id >= 500000) AND (id <= 500099))                        
     Heap Fetches: 100                                                      
     Buffers: shared hit=6                                                  
   Planning:                                                                
     Buffers: shared hit=6                                                  
   (6 dòng)
[app]  3411ms  explain (analyze, buffers, costs off, timing off, summary off) select id from requests order by id desc limit 5
   [app] →
   QUERY PLAN                                                                            
   --------------------------------------------------------------------------------------
   Limit (actual rows=5 loops=1)                                                         
     Buffers: shared hit=4                                                               
     ->  Index Only Scan Backward using requests_pkey on requests (actual rows=5 loops=1)
           Heap Fetches: 5                                                               
           Buffers: shared hit=4                                                         
   (5 dòng)

## 4. Deduplication: index trên cột chỉ có 3 giá trị
[app]  3412ms  create index status_dedup on requests (status)
   [app] → CREATE
[app]  3852ms  create index status_no_dedup on requests (status) with (deduplicate_items = off)
   [app] → CREATE
[app]  4396ms  select relname, pg_size_pretty(pg_relation_size(oid)) as kich_thuoc, pg_relation_size(oid) / current_setting('block_size')::int as so_trang from pg_class where relname in ('status_dedup', 'status_no_dedup') and relnamespace = 'exp_bt'::regnamespace order by relname
   [app] →
   relname         | kich_thuoc | so_trang
   ----------------+------------+---------
   status_dedup    | 6904 kB    | 863     
   status_no_dedup | 30 MB      | 3803    
   (2 dòng)

## 5. LIKE theo tiền tố trên cột text
[app]  4397ms  select datcollate from pg_database where datname = current_database()
   [app] →
   datcollate
   ----------
   C.UTF-8   
   (1 dòng)
[app]  4398ms  create index title_default on requests (title)
   [app] → CREATE
[app]  5162ms  analyze requests
   [app] → ANALYZE
[app]  5284ms  explain (costs off) select id from requests where title like 'Yêu cầu số 12345%'
   [app] →
   QUERY PLAN                                          
   ----------------------------------------------------
   Gather                                              
     Workers Planned: 2                                
     ->  Parallel Seq Scan on requests                 
           Filter: (title ~~ 'Yêu cầu số 12345%'::text)
   (4 dòng)
[app]  5285ms  explain (costs off) select id from requests where title = 'Yêu cầu số 12345'
   [app] →
   QUERY PLAN                                      
   ------------------------------------------------
   Index Scan using title_default on requests      
     Index Cond: (title = 'Yêu cầu số 12345'::text)
   (2 dòng)
[app]  5285ms  create index title_pattern on requests (title text_pattern_ops)
   [app] → CREATE
[app]  6018ms  explain (costs off) select id from requests where title like 'Yêu cầu số 12345%'
   [app] →
   QUERY PLAN                                                                                    
   ----------------------------------------------------------------------------------------------
   Index Scan using title_pattern on requests                                                    
     Index Cond: ((title ~>=~ 'Yêu cầu số 12345'::text) AND (title ~<~ 'Yêu cầu số 12346'::text))
     Filter: (title ~~ 'Yêu cầu số 12345%'::text)                                                
   (3 dòng)
```
