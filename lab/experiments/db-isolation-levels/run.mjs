// Hai phiên đọc ghi đồng thời ở Read Committed, Repeatable Read và Serializable trên PostgreSQL.
import { header, session, step, note } from '../../lib/harness.mjs';

await header('Isolation level trên PostgreSQL');
const setup = await session('setup');
await setup.q('drop schema if exists exp_iso cascade');
await setup.q('create schema exp_iso');
await setup.q(`create table exp_iso.requests (id integer primary key, department text not null, status text not null)`);
await setup.q(`create table exp_iso.approvers (user_id integer primary key, department text not null, active boolean not null)`);
await setup.end();

const reset = async (s) => {
  await s.q(`truncate exp_iso.requests, exp_iso.approvers`, undefined, { quiet: true });
  await s.q(`insert into exp_iso.requests values (1,'IT','pending'),(2,'IT','pending'),(3,'IT','approved')`, undefined, { quiet: true });
  await s.q(`insert into exp_iso.approvers values (10,'IT',true),(11,'IT',true)`, undefined, { quiet: true });
};

const A = await session('A');
const B = await session('B');
await A.q('set search_path = exp_iso');
await B.q('set search_path = exp_iso');

step('1. Read Committed: hai lần đọc trong cùng transaction thấy kết quả khác nhau');
await reset(A);
await A.q('begin isolation level read committed');
await A.q(`select count(*) as pending from requests where status = 'pending'`);
await B.q(`update requests set status = 'approved' where id = 1`);
await A.q(`select count(*) as pending from requests where status = 'pending'`);
await A.q('commit');
note('Mỗi câu lệnh lấy snapshot mới, nên thấy thay đổi B đã commit giữa chừng.');

step('2. Repeatable Read: snapshot cố định từ câu lệnh đầu tiên của transaction');
await reset(A);
await A.q('begin isolation level repeatable read');
await A.q(`select id, status from requests where status = 'pending' order by id`);
await B.q(`update requests set status = 'approved' where id = 1`);
await B.q(`insert into requests values (4, 'IT', 'pending')`);
await A.q(`select id, status from requests where status = 'pending' order by id`);
note('A vẫn thấy dòng 1 là pending và không thấy dòng 4 mới chèn (không có phantom read trên PostgreSQL).');
await A.q('commit');
await A.q(`select id, status from requests where status = 'pending' order by id`);
note('Sau khi commit, transaction mới của A mới thấy thay đổi của B.');

step('3. Repeatable Read: cập nhật dòng mà transaction khác đã sửa và commit');
await reset(A);
await A.q('begin isolation level repeatable read');
await A.q(`select status from requests where id = 2`);
await B.q(`update requests set status = 'rejected' where id = 2`);
await A.q(`update requests set status = 'approved' where id = 2`);
await A.q('rollback');
note('Ứng dụng phải bắt lỗi SQLSTATE 40001 và chạy lại cả transaction.');

step('4. Write skew ở Repeatable Read: mỗi admin tắt một người duyệt, phòng IT mất cả hai');
await reset(A);
await A.q('begin isolation level repeatable read');
await B.q('begin isolation level repeatable read');
await A.q(`select count(*) as dang_hoat_dong from approvers where department = 'IT' and active`);
await B.q(`select count(*) as dang_hoat_dong from approvers where department = 'IT' and active`);
note('Cả hai thấy còn 2 người duyệt, nên đều nghĩ tắt một người là an toàn.');
await A.q(`update approvers set active = false where user_id = 10`);
await B.q(`update approvers set active = false where user_id = 11`);
await A.q('commit');
await B.q('commit');
await A.q(`select count(*) as dang_hoat_dong from approvers where department = 'IT' and active`);

step('5. Cùng kịch bản ở Serializable: một transaction bị hủy');
await reset(A);
await A.q('begin isolation level serializable');
await B.q('begin isolation level serializable');
await A.q(`select count(*) as dang_hoat_dong from approvers where department = 'IT' and active`);
await B.q(`select count(*) as dang_hoat_dong from approvers where department = 'IT' and active`);
await A.q(`update approvers set active = false where user_id = 10`);
await B.q(`update approvers set active = false where user_id = 11`);
await A.q('commit');
await B.q('commit');
await A.q(`select count(*) as dang_hoat_dong from approvers where department = 'IT' and active`);

await A.end();
await B.end();
