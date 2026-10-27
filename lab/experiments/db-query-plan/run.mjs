// Đọc kế hoạch thực thi trên PostgreSQL: ước tính so với thực tế, cột tương quan, thống kê cũ, LIMIT với index, và EXPLAIN ANALYZE trên lệnh ghi.
import { header, session, step, note } from '../../lib/harness.mjs';
import { makeRequests } from '../../lib/requests-1m.mjs';

await header('Query plan và EXPLAIN trên PostgreSQL');
const s = await session('app');
await makeRequests(s, 'exp_plan');
await s.q('create index requests_requester_idx on requests (requester_id)');
await s.q('analyze requests');

step('1. EXPLAIN chỉ ước tính; EXPLAIN ANALYZE chạy thật và cho số dòng thực tế');
await s.q(`explain select id, status from requests where requester_id = 1234`);
await s.q(`explain (analyze, timing off, summary off) select id, status from requests where requester_id = 1234`);

step('2. Hai cột tương quan: planner nhân xác suất và ước tính thiếu');
note('department_id của người gửi 1234 luôn là 14, nên điều kiện thứ hai không loại thêm dòng nào.');
await s.q(`select count(*) from requests where requester_id = 1234 and department_id = 14`);
await s.q(`explain (analyze, timing off, summary off) select id from requests where requester_id = 1234 and department_id = 14`);
await s.q(`create statistics requests_req_dep (dependencies) on requester_id, department_id from requests`);
await s.q('analyze requests');
await s.q(`explain (analyze, timing off, summary off) select id from requests where requester_id = 1234 and department_id = 14`);

step('3. Thống kê cũ: dữ liệu đổi mà chưa ANALYZE');
await s.q(`create table batch (id bigint, status text) with (autovacuum_enabled = off)`);
await s.q(`insert into batch select g, 'pending' from generate_series(1, 1000) g`);
await s.q('analyze batch');
await s.q(`insert into batch select g, 'approved' from generate_series(1001, 201000) g`);
await s.q(`explain (analyze, timing off, summary off) select count(*) from batch where status = 'approved'`);
note('Thống kê lấy lúc bảng chỉ có pending, nên planner gần như không tin có dòng approved.');
await s.q('analyze batch');
await s.q(`explain (analyze, timing off, summary off) select count(*) from batch where status = 'approved'`);

step('4. ORDER BY ... LIMIT: sắp xếp toàn bộ so với đọc index theo thứ tự');
const latest = `select id, title from requests order by created_at desc limit 20`;
await s.q(latest, undefined, { quiet: true });
await s.q(`explain (analyze, buffers, timing off) ${latest}`);
await s.q('create index requests_created_idx on requests (created_at)');
await s.q(latest, undefined, { quiet: true });
await s.q(`explain (analyze, buffers, timing off) ${latest}`);

step('5. EXPLAIN ANALYZE chạy thật cả lệnh ghi: bọc trong transaction rồi rollback');
await s.q(`select count(*) as pending from requests where status = 'pending'`);
await s.q('begin');
await s.q(`explain (analyze, timing off, summary off) update requests set status = 'approved' where status = 'pending' and requester_id = 1234`);
await s.q(`select count(*) as pending_trong_transaction from requests where status = 'pending'`);
await s.q('rollback');
await s.q(`select count(*) as pending_sau_rollback from requests where status = 'pending'`);
await s.end();
