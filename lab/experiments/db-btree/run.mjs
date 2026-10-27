// B-tree trên PostgreSQL: số tầng và số trang mỗi tầng của index 1 triệu dòng, tìm một khóa đi qua mấy trang, quét theo khoảng và ngược, deduplication, LIKE theo tiền tố.
import { header, session, step, note } from '../../lib/harness.mjs';
import { makeRequests } from '../../lib/requests-1m.mjs';

await header('B-tree trên PostgreSQL');
const s = await session('app');
await makeRequests(s, 'exp_bt');
await s.q('create extension if not exists pageinspect');
await s.q('analyze requests');

step('1. Cấu trúc của index khóa chính (1 triệu dòng)');
await s.q(`select root, level, fastroot, fastlevel from bt_metap('exp_bt.requests_pkey')`);
note('level là số tầng phía trên tầng lá; root là số block của trang gốc.');
await s.q(`select p.btpo_level as tang, case when p.btpo_level = 0 then 'lá' else 'trong' end as loai, count(*) as so_trang, sum(p.live_items) as so_muc
  from generate_series(1, pg_relation_size('exp_bt.requests_pkey') / current_setting('block_size')::int - 1) blk,
       lateral bt_page_stats('exp_bt.requests_pkey', blk) p
  group by p.btpo_level order by p.btpo_level desc`);
await s.q(`select round(100.0 * count(*) filter (where p.btpo_level = 0) / count(*), 2) as pct_trang_la
  from generate_series(1, pg_relation_size('exp_bt.requests_pkey') / current_setting('block_size')::int - 1) blk,
       lateral bt_page_stats('exp_bt.requests_pkey', blk) p`);

step('2. Tìm một khóa: đi từ gốc xuống lá rồi đọc một trang của bảng');
await s.q(`select id, status from requests where id = 777777`, undefined, { quiet: true });
await s.q(`explain (analyze, buffers, costs off, timing off, summary off) select id, status from requests where id = 777777`);

step('3. Quét theo khoảng và quét ngược');
await s.q(`explain (analyze, buffers, costs off, timing off, summary off) select id from requests where id between 500000 and 500099`);
await s.q(`explain (analyze, buffers, costs off, timing off, summary off) select id from requests order by id desc limit 5`);

step('4. Deduplication: index trên cột chỉ có 3 giá trị');
await s.q(`create index status_dedup on requests (status)`);
await s.q(`create index status_no_dedup on requests (status) with (deduplicate_items = off)`);
await s.q(`select relname, pg_size_pretty(pg_relation_size(oid)) as kich_thuoc, pg_relation_size(oid) / current_setting('block_size')::int as so_trang
  from pg_class where relname in ('status_dedup', 'status_no_dedup') and relnamespace = 'exp_bt'::regnamespace order by relname`);

step('5. LIKE theo tiền tố trên cột text');
await s.q(`select datcollate from pg_database where datname = current_database()`);
await s.q(`create index title_default on requests (title)`);
await s.q('analyze requests');
await s.q(`explain (costs off) select id from requests where title like 'Yêu cầu số 12345%'`);
await s.q(`explain (costs off) select id from requests where title = 'Yêu cầu số 12345'`);
await s.q(`create index title_pattern on requests (title text_pattern_ops)`);
await s.q(`explain (costs off) select id from requests where title like 'Yêu cầu số 12345%'`);
await s.end();
