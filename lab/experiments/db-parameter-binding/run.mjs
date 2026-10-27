// Ghép chuỗi SQL với dữ liệu người dùng so với truyền tham số (bind variable).
import { header, session, step, note } from '../../lib/harness.mjs';

await header('Ghép chuỗi SQL và bind variable');
const s = await session('app');
await s.q('drop schema if exists exp_bind cascade');
await s.q('create schema exp_bind');
await s.q('set search_path = exp_bind');
await s.q(`create table requests (id integer primary key, requester_email text not null, title text not null)`);
await s.q(`insert into requests values (1, 'an@example.com', 'Xin cấp laptop'), (2, 'binh@example.com', 'Lương tháng 9 bị sai'), (3, 'chi@example.com', 'Xin nghỉ phép')`);

const input = `an@example.com' or '1'='1`;
step('1. Ghép chuỗi: chuỗi nhập từ ô tìm kiếm trở thành một phần câu lệnh');
console.log(`-- chuỗi người dùng nhập: ${input}`);
await s.q(`select id, requester_email, title from requests where requester_email = '${input}'`);
note('Trả về yêu cầu của mọi người, kể cả yêu cầu nhạy cảm của người khác.');

step('2. Bind variable: chuỗi nhập chỉ được so sánh như một giá trị');
await s.q(`select id, requester_email, title from requests where requester_email = $1`, [input]);
await s.q(`select id, requester_email, title from requests where requester_email = $1`, ['an@example.com']);

step('3. Prepared statement: một câu lệnh, nhiều giá trị');
await s.q(`prepare by_email (text) as select id, title from requests where requester_email = $1`);
await s.q(`execute by_email('chi@example.com')`);
await s.q(`execute by_email('binh@example.com')`);
await s.q(`select name, statement, parameter_types, from_sql from pg_prepared_statements order by name`);
note('Hai truy vấn dùng $1 ở bước 2 không có name nên không nằm trong danh sách.');

step('4. Truy vấn có name: node-postgres tạo prepared statement có tên ở phía máy chủ');
for (const email of ['an@example.com', 'chi@example.com']) {
  console.log(`[app] client.query({ name: 'by_email_named', text: 'select id, title from requests where requester_email = $1', values: [${JSON.stringify(email)}] })`);
  const r = await s.client.query({ name: 'by_email_named', text: 'select id, title from requests where requester_email = $1', values: [email] });
  console.log(`   [app] → ${r.rowCount} dòng`);
}
await s.q(`select name, statement, parameter_types, from_sql from pg_prepared_statements order by name`);
note('from_sql = false: câu do giao thức tạo (Parse có tên), không phải lệnh PREPARE trong SQL.');
await s.end();
