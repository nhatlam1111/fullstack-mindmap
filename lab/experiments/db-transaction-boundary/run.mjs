// "Kiểm tra rồi mới ghi" ngoài transaction so với update có điều kiện: hai quản lý cùng bấm duyệt một yêu cầu.
import { header, session, step, note, sleep } from '../../lib/harness.mjs';

await header('Ranh giới transaction khi kiểm tra rồi mới ghi');
const A = await session('A');
const B = await session('B');
await A.q('drop schema if exists exp_tb cascade');
await A.q('create schema exp_tb');
await A.q(`create table exp_tb.requests (id integer primary key, status text not null, approved_by integer)`);
await A.q(`create table exp_tb.request_status_history (id integer generated always as identity, request_id integer not null, to_status text not null, changed_by integer not null)`);
for (const s of [A, B]) await s.q('set search_path = exp_tb', undefined, { quiet: true });
const reset = () => A.q(`truncate requests, request_status_history; insert into requests values (1, 'pending', null)`, undefined, { quiet: true });

step('1. Đọc trạng thái, kiểm tra ở ứng dụng, rồi mới ghi (mỗi lệnh tự commit)');
await reset();
const a1 = await A.q(`select status from requests where id = 1`);
const b1 = await B.q(`select status from requests where id = 1`);
if (a1.rows[0].status === 'pending') {
  await A.q(`update requests set status = 'approved', approved_by = 10 where id = 1`);
  await A.q(`insert into request_status_history (request_id, to_status, changed_by) values (1, 'approved', 10)`);
}
if (b1.rows[0].status === 'pending') {
  await B.q(`update requests set status = 'rejected', approved_by = 11 where id = 1`);
  await B.q(`insert into request_status_history (request_id, to_status, changed_by) values (1, 'rejected', 11)`);
}
await A.q(`select * from requests`);
await A.q(`select request_id, to_status, changed_by from request_status_history order by id`);
note('Cả hai quản lý đều thấy pending và đều ghi: lịch sử có hai quyết định trái ngược, kết quả phụ thuộc ai ghi sau.');

step('2. Update có điều kiện trong một transaction: lệnh tự kiểm tra trạng thái và trả về số dòng đã đổi');
await reset();
const decide = async (s, status, user) => {
  await s.q('begin');
  const r = await s.q(`update requests set status = $1, approved_by = $2 where id = 1 and status = 'pending' returning id`, [status, user]);
  if (r.rowCount === 1) {
    await s.q(`insert into request_status_history (request_id, to_status, changed_by) values (1, $1, $2)`, [status, user]);
    await s.q('commit');
  } else {
    await s.q('rollback');
    console.log(`-- ${s.name}: yêu cầu không còn ở trạng thái pending, báo cho người dùng thay vì ghi đè`);
  }
};
await A.q(`select status from requests where id = 1`);
await B.q(`select status from requests where id = 1`);
await decide(A, 'approved', 10);
await decide(B, 'rejected', 11);
await A.q(`select * from requests`);
await A.q(`select request_id, to_status, changed_by from request_status_history order by id`);

step('3. Hai quyết định chạy đồng thời thật sự');
await reset();
await A.q('begin');
await B.q('begin');
const ra = await A.q(`update requests set status = 'approved', approved_by = 10 where id = 1 and status = 'pending' returning id`);
const pb = B.q(`update requests set status = 'rejected', approved_by = 11 where id = 1 and status = 'pending' returning id`);
await sleep(500);
const mon = await session('monitor');
await mon.q(`select application_name, wait_event_type, wait_event from pg_stat_activity where application_name = 'lab-B'`);
await mon.end();
note('B chờ transaction A kết thúc (wait_event_type = Lock, wait_event = transactionid).');
if (ra.rowCount === 1) await A.q(`insert into request_status_history (request_id, to_status, changed_by) values (1, 'approved', 10)`);
await A.q('commit');
const rb = await pb;
note(`Sau khi A commit, câu update của B đánh giá lại điều kiện trên dòng mới và đổi ${rb.rowCount} dòng.`);
await B.q('rollback');
await A.q(`select * from requests`);
step('4. Đọc rồi update không điều kiện, cả hai bước trong cùng một transaction Read Committed');
await reset();
await A.q('begin');
await B.q('begin');
await A.q(`select status from requests where id = 1`);
await B.q(`select status from requests where id = 1`);
note('Cả hai transaction đều thấy pending và ứng dụng quyết định ghi.');
await A.q(`update requests set status = 'approved', approved_by = 10 where id = 1`);
const pb4 = B.q(`update requests set status = 'rejected', approved_by = 11 where id = 1`);
await sleep(500);
await A.q(`insert into request_status_history (request_id, to_status, changed_by) values (1, 'approved', 10)`);
await A.q('commit');
await pb4;
await B.q(`insert into request_status_history (request_id, to_status, changed_by) values (1, 'rejected', 11)`);
await B.q('commit');
await A.q(`select * from requests`);
await A.q(`select request_id, to_status, changed_by from request_status_history order by id`);
note('B chờ A commit rồi vẫn ghi đè, vì điều kiện where id = 1 vẫn đúng với dòng mới.');

step('5. Khóa dòng ngay lúc đọc bằng SELECT ... FOR UPDATE, kiểm tra ở ứng dụng rồi mới ghi');
await reset();
await A.q('begin');
await B.q('begin');
const r5a = await A.q(`select status from requests where id = 1 for update`);
const p5b = B.q(`select status from requests where id = 1 for update`);
await sleep(500);
const mon5 = await session('monitor');
await mon5.q(`select application_name, wait_event_type, wait_event from pg_stat_activity where application_name = 'lab-B'`);
await mon5.end();
note('B chờ ngay ở câu SELECT ... FOR UPDATE vì A đang giữ khóa dòng.');
if (r5a.rows[0].status === 'pending') {
  await A.q(`update requests set status = 'approved', approved_by = 10 where id = 1`);
  await A.q(`insert into request_status_history (request_id, to_status, changed_by) values (1, 'approved', 10)`);
}
await A.q('commit');
const r5b = await p5b;
if (r5b.rows[0].status === 'pending') {
  await B.q(`update requests set status = 'rejected', approved_by = 11 where id = 1`);
  await B.q(`insert into request_status_history (request_id, to_status, changed_by) values (1, 'rejected', 11)`);
  await B.q('commit');
} else {
  console.log(`-- B: sau khi được khóa, B đọc thấy trạng thái ${r5b.rows[0].status}, nên rollback và báo người dùng`);
  await B.q('rollback');
}
await A.q(`select * from requests`);
await A.q(`select request_id, to_status, changed_by from request_status_history order by id`);
await A.end();
await B.end();
