// Index trên PostgreSQL: tìm theo người gửi khi chưa có và đã có index, khi nào planner bỏ qua index, và giá phải trả khi ghi.
import { header, session, step, note } from '../../lib/harness.mjs';
import { makeRequests } from '../../lib/requests-1m.mjs';

await header('Index trên PostgreSQL: lợi ích và giá phải trả');
const s = await session('app');
await makeRequests(s, 'exp_idx');
await s.q('analyze requests');
const q = `select id, status, created_at from requests where requester_id = 1234`;
const explain = (sql) => s.q(`explain (analyze, buffers, costs off, timing off) ${sql}`);

step('1. Chưa có index trên requester_id');
await s.q(q, undefined, { quiet: true });
note('Đã chạy truy vấn một lần trước để làm nóng cache, số liệu dưới là lần thứ hai.');
await explain(q);

step('2. Tạo index trên requester_id');
let t = performance.now();
await s.q('create index requests_requester_idx on requests (requester_id)');
console.log(`-- thời gian tạo index: ${((performance.now() - t) / 1000).toFixed(2)} giây`);
await s.q(`select pg_size_pretty(pg_relation_size('requests')) as bang, pg_size_pretty(pg_relation_size('requests_requester_idx')) as index_requester`);
await s.q(q, undefined, { quiet: true });
await explain(q);

step('3. Index trên status: planner dùng hay bỏ tùy tỷ lệ dòng khớp');
await s.q('create index requests_status_idx on requests (status)');
await s.q('analyze requests');
await explain(`select count(*) from requests where status = 'pending'`);
await explain(`select count(*) from requests where status = 'approved'`);

step('4. Giá khi ghi: chèn 200.000 dòng vào bảng không có index và bảng có 4 index');
await s.q('create table w0 (like requests)');
await s.q('create table w4 (like requests including indexes)');
await s.q(`create index on w4 (created_at)`);
await s.q(`select tablename, count(*) as so_index from pg_indexes where schemaname = 'exp_idx' and tablename in ('w0', 'w4') group by tablename order by tablename`);
const ins = (tbl) => `insert into ${tbl} select * from requests where id <= 200000`;
for (let run = 1; run <= 3; run++) {
  for (const tbl of ['w0', 'w4']) {
    await s.q(`truncate ${tbl}`, undefined, { quiet: true });
    t = performance.now();
    await s.q(ins(tbl), undefined, { quiet: true });
    console.log(`-- lần ${run}, ${tbl}: ${(performance.now() - t).toFixed(0)} ms`);
  }
}
await s.q(`select relname, pg_size_pretty(pg_total_relation_size(oid)) as tong_kich_thuoc, pg_size_pretty(pg_indexes_size(oid)) as cua_index
  from pg_class where relnamespace = 'exp_idx'::regnamespace and relname in ('w0', 'w4') order by relname`);

step('5. Index nào thực sự được dùng');
await s.q('select pg_stat_force_next_flush()', undefined, { quiet: true });
await s.q(`select indexrelname, idx_scan from pg_stat_user_indexes where schemaname = 'exp_idx' and relname = 'requests' order by indexrelname`);
note('idx_scan đếm số lần index được quét từ khi tạo; index có idx_scan = 0 qua thời gian dài là ứng viên để xóa.');
await s.end();
