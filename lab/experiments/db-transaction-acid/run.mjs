// Atomicity: duyệt yêu cầu gồm hai bước. Bước hai lỗi thì có transaction và không có transaction khác nhau thế nào.
import { header, session, step, note } from '../../lib/harness.mjs';

await header('Atomicity khi duyệt yêu cầu');
const a = await session('A');
await a.q('drop schema if exists exp_acid cascade');
await a.q('create schema exp_acid');
await a.q('set search_path = exp_acid');
await a.q(`create table requests (id integer primary key, status text not null check (status in ('pending','approved','rejected')))`);
await a.q(`create table request_status_history (
  id integer generated always as identity primary key,
  request_id integer not null references requests,
  to_status text not null,
  changed_by integer not null)`);
await a.q(`insert into requests values (1, 'pending'), (2, 'pending')`);

step('Không dùng transaction: mỗi lệnh tự commit');
await a.q(`update requests set status = 'approved' where id = 1`);
await a.q(`insert into request_status_history (request_id, to_status, changed_by) values (1, 'approved', null)`);
await a.q(`select r.id, r.status, (select count(*) from request_status_history h where h.request_id = r.id) as so_dong_lich_su from requests r where id = 1`);
note('Yêu cầu 1 đã đổi trạng thái nhưng không có lịch sử: dữ liệu nửa vời.');

step('Dùng transaction: bước hai lỗi thì bước một cũng không còn');
await a.q('begin');
await a.q(`update requests set status = 'approved' where id = 2`);
await a.q(`insert into request_status_history (request_id, to_status, changed_by) values (2, 'approved', null)`);
await a.q(`select 1`);
note('Sau một lỗi, PostgreSQL từ chối mọi lệnh tiếp theo cho tới khi rollback.');
await a.q('rollback');
await a.q(`select r.id, r.status, (select count(*) from request_status_history h where h.request_id = r.id) as so_dong_lich_su from requests r where id = 2`);

step('Dùng transaction, cả hai bước đều đúng');
await a.q('begin');
await a.q(`update requests set status = 'approved' where id = 2`);
await a.q(`insert into request_status_history (request_id, to_status, changed_by) values (2, 'approved', 7)`);
await a.q('commit');
await a.q(`select r.id, r.status, (select count(*) from request_status_history h where h.request_id = r.id) as so_dong_lich_su from requests r order by id`);
await a.end();
