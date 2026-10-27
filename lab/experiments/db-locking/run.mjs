// Khóa dòng, lost update, deadlock và hàng đợi khóa khi đổi schema trên PostgreSQL.
import { header, session, step, note, sleep } from '../../lib/harness.mjs';

await header('Locking và deadlock trên PostgreSQL');
const A = await session('A');
const B = await session('B');
const C = await session('C');
await A.q('drop schema if exists exp_lock cascade');
await A.q('create schema exp_lock');
await A.q(`create table exp_lock.requests (id integer primary key, status text not null, approvals integer not null default 0)`);
for (const s of [A, B, C]) await s.q('set search_path = exp_lock', undefined, { quiet: true });
const reset = () => A.q(`truncate requests; insert into requests values (1, 'pending', 0), (2, 'pending', 0)`, undefined, { quiet: true });

step('1. Lost update: hai phiên đọc rồi ghi đè giá trị đã tính ở ứng dụng');
await reset();
const ra = await A.q(`select approvals from requests where id = 1`);
const rb = await B.q(`select approvals from requests where id = 1`);
await A.q(`update requests set approvals = $1 where id = 1`, [ra.rows[0].approvals + 1]);
await B.q(`update requests set approvals = $1 where id = 1`, [rb.rows[0].approvals + 1]);
await A.q(`select approvals from requests where id = 1`);
note('Hai lượt duyệt nhưng chỉ còn 1: lượt của A bị ghi đè.');

step('2. SELECT ... FOR UPDATE: phiên thứ hai chờ tới khi phiên đầu commit');
await reset();
await A.q('begin');
await A.q(`select approvals from requests where id = 1 for update`);
const t = Date.now();
const waitB = (async () => {
  await B.q('begin');
  const r = await B.q(`select approvals from requests where id = 1 for update`);
  console.log(`-- B chờ khóa khoảng ${Math.round((Date.now() - t) / 100) * 100}ms rồi mới đọc được`);
  await B.q(`update requests set approvals = $1 where id = 1`, [r.rows[0].approvals + 1]);
  await B.q('commit');
})();
await sleep(1000);
await C.q(`select pid, wait_event_type, wait_event, left(query, 60) as query from pg_stat_activity where application_name = 'lab-B'`);
await A.q(`update requests set approvals = approvals + 1 where id = 1`);
await A.q('commit');
await waitB;
await A.q(`select approvals from requests where id = 1`);
note('Đủ 2 lượt duyệt.');

step('2b. Update nguyên tử approvals = approvals + 1 từ hai phiên chạy đồng thời (Read Committed)');
await reset();
await A.q('begin');
await B.q('begin');
await A.q(`update requests set approvals = approvals + 1 where id = 1`);
const pb2 = B.q(`update requests set approvals = approvals + 1 where id = 1`);
await sleep(300);
await A.q('commit');
await pb2;
await B.q('commit');
await A.q(`select approvals from requests where id = 1`);
note('B chờ A commit, rồi cộng thêm vào giá trị A vừa ghi: đủ 2 lượt.');

step('2c. Cùng câu update nguyên tử nhưng B chạy ở Repeatable Read');
await reset();
await A.q('begin');
await B.q('begin isolation level repeatable read');
await B.q(`select approvals from requests where id = 2`);
await A.q(`update requests set approvals = approvals + 1 where id = 1`);
const pb3 = B.q(`update requests set approvals = approvals + 1 where id = 1`);
await sleep(300);
await A.q('commit');
await pb3;
await B.q('rollback');
await A.q(`select approvals from requests where id = 1`);
note('Ở Repeatable Read, B không được ghi lên dòng đã bị transaction khác sửa và commit sau khi snapshot của B được lấy: phải chạy lại cả transaction.');

step('3. Deadlock: hai phiên khóa hai dòng theo thứ tự ngược nhau');
await reset();
await A.q('begin');
await B.q('begin');
await A.q(`update requests set status = 'approved' where id = 1`);
await B.q(`update requests set status = 'approved' where id = 2`);
const pA = A.q(`update requests set status = 'approved' where id = 2`);
await sleep(300);
const pB = B.q(`update requests set status = 'approved' where id = 1`);
await Promise.all([pA, pB]);
await A.q('rollback');
await B.q('rollback');
note('Sau khoảng deadlock_timeout (mặc định 1s), PostgreSQL hủy một transaction (ở lần chạy này là A, lỗi 40P01); câu update đang chờ của B chạy tiếp.');
await A.q(`show deadlock_timeout`);

step('4. Hàng đợi khóa: ALTER TABLE chờ sau một transaction đọc dài, chặn luôn các SELECT đến sau');
await reset();
await A.q('begin');
await A.q(`select count(*) from requests`);
note('A chưa commit, vẫn giữ khóa ACCESS SHARE trên bảng.');
const alter = B.q(`alter table requests add column note text`);
await sleep(300);
const t4 = Date.now();
const read = (async () => { await C.q(`select count(*) from requests`); console.log(`-- SELECT của C phải chờ khoảng ${Math.round((Date.now() - t4) / 100) * 100}ms`); })();
await sleep(1500);
const mon = await session('monitor');
await mon.q(`select application_name, wait_event_type, wait_event, left(query, 50) as query from pg_stat_activity where application_name in ('lab-B', 'lab-C') order by 1`);
await mon.q(`select l.mode, l.granted, a.application_name from pg_locks l join pg_stat_activity a on a.pid = l.pid where l.relation = 'exp_lock.requests'::regclass order by a.application_name, l.mode`);
await A.q('commit');
await alter;
await read;

step('5. Cùng tình huống nhưng đặt lock_timeout cho câu đổi schema; C gửi SELECT trong lúc ALTER đang chờ');
await reset();
await A.q('begin');
await A.q(`select count(*) from requests`);
await B.q(`set lock_timeout = '500ms'`);
const t5 = Date.now();
const alter5 = (async () => { await B.q(`alter table requests add column note2 text`); console.log(`-- ALTER TABLE bỏ cuộc sau khoảng ${Math.round((Date.now() - t5) / 100) * 100}ms`); })();
await sleep(100);
const t5c = Date.now();
await C.q(`select count(*) from requests`);
console.log(`-- SELECT của C chờ khoảng ${Math.round((Date.now() - t5c) / 100) * 100}ms, tức tới khi ALTER bỏ cuộc`);
await alter5;
await A.q('commit');
await B.q(`reset lock_timeout`);

for (const s of [A, B, C, mon]) await s.end();
