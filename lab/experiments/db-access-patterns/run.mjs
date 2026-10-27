// Thiết kế index theo truy vấn của màn hình "Yêu cầu của tôi": thứ tự cột trong index ghép, cột dẫn đầu, covering index, partial index.
import { header, session, step, note } from '../../lib/harness.mjs';
import { makeRequests } from '../../lib/requests-1m.mjs';

await header('Mô hình truy vấn và thiết kế index trên PostgreSQL');
const s = await session('app');
await makeRequests(s, 'exp_ap');
await s.q('analyze requests');
const mine = `select id, status, created_at from requests where requester_id = 1234 order by created_at desc limit 20`;
const ex = async (sql) => { await s.q(sql, undefined, { quiet: true }); return s.q(`explain (analyze, buffers, costs off, timing off) ${sql}`); };
note('Truy vấn của màn hình "Yêu cầu của tôi": 20 yêu cầu mới nhất của một người gửi.');

step('1. Chỉ có index trên created_at');
await s.q('create index ap_created on requests (created_at)');
await s.q('analyze requests');
await ex(mine);

step('2. Chỉ có index trên requester_id');
await s.q('drop index ap_created');
await s.q('create index ap_requester on requests (requester_id)');
await s.q('analyze requests');
await ex(mine);

step('3. Index ghép (requester_id, created_at)');
await s.q('drop index ap_requester');
await s.q('create index ap_req_created on requests (requester_id, created_at)');
await s.q('analyze requests');
await ex(mine);

step('4. Truy vấn chỉ lọc theo cột thứ hai của index ghép');
const lastDay = `select count(*) from requests where created_at >= timestamptz '2025-11-01 00:00+07' and created_at < timestamptz '2025-11-02 00:00+07'`;
await ex(lastDay);
note('created_at không phải cột dẫn đầu của ap_req_created, nên index không giới hạn được phần cần quét.');

step('5. Covering index: thêm id và status vào index bằng INCLUDE');
await s.q('create index ap_req_created_cover on requests (requester_id, created_at) include (id, status)');
await s.q('drop index ap_req_created');
await s.q('analyze requests');
await ex(mine);
note('Bảng chưa được VACUUM nên visibility map chưa đánh dấu trang nào all-visible.');
await s.q('vacuum requests');
await ex(mine);

step('6. Partial index cho danh sách chờ duyệt');
const pending = `select id, requester_id, created_at from requests where status = 'pending' order by created_at desc limit 20`;
await s.q('create index ap_status_created on requests (status, created_at)');
await s.q(`create index ap_pending_created on requests (created_at) where status = 'pending'`);
await s.q(`select relname, pg_size_pretty(pg_relation_size(oid)) as kich_thuoc from pg_class
  where relname in ('ap_status_created', 'ap_pending_created') and relnamespace = 'exp_ap'::regnamespace order by relname`);
await s.q('analyze requests');
await ex(pending);

step('7. Partial index với câu lệnh có tham số: custom plan và generic plan');
await s.q(`prepare pending_list(text) as select id, requester_id, created_at from requests where status = $1 order by created_at desc limit 20`);
await s.q('set plan_cache_mode = force_custom_plan');
await s.q(`explain (costs off) execute pending_list('pending')`);
await s.q('set plan_cache_mode = force_generic_plan');
await s.q(`explain (costs off) execute pending_list('pending')`);
note('Generic plan được lập một lần cho mọi giá trị của $1, nên không thể dựa vào việc $1 là pending để chọn partial index.');
await s.q('reset plan_cache_mode');
await s.end();
