// Bất thường khi cập nhật (update anomaly) ở bảng lặp dữ liệu, so với bảng đã tách.
import { header, session, step, note } from '../../lib/harness.mjs';

await header('Dữ liệu lặp và bất thường khi cập nhật');
const a = await session('A');
await a.q('drop schema if exists exp_norm cascade');
await a.q('create schema exp_norm');
await a.q('set search_path = exp_norm');

step('Bảng gộp: tên phòng ban lặp lại trong mỗi yêu cầu');
await a.q(`create table requests_flat (
  id integer primary key, title text not null,
  requester_email text not null, department_name text not null)`);
await a.q(`insert into requests_flat values
  (1, 'Xin cấp laptop',      'an@example.com',   'Phòng Nhân sự'),
  (2, 'Đăng ký đào tạo',     'an@example.com',   'Phòng Nhân sự'),
  (3, 'Xin nghỉ phép',       'chi@example.com',  'Phòng Nhân sự'),
  (4, 'Cấp quyền VPN',       'binh@example.com', 'Phòng Kỹ thuật')`);

step('Đổi tên phòng ban nhưng chỉ sửa ở những yêu cầu đang xem');
note('Giống một màn hình chỉ cập nhật các dòng của một nhân viên.');
await a.q(`update requests_flat set department_name = 'Phòng Nhân sự và Đào tạo' where requester_email = 'an@example.com'`);
await a.q(`select department_name, count(*) from requests_flat where requester_email <> 'binh@example.com' group by department_name order by 1`);
note('Cùng một phòng ban giờ có hai tên khác nhau.');

step('Bảng đã tách: tên phòng ban nằm ở đúng một chỗ');
await a.q(`create table departments (id integer primary key, name text not null unique)`);
await a.q(`create table users (email text primary key, department_id integer not null references departments)`);
await a.q(`create table requests (id integer primary key, title text not null, requester_email text not null references users)`);
await a.q(`insert into departments values (1, 'Phòng Nhân sự'), (2, 'Phòng Kỹ thuật')`);
await a.q(`insert into users values ('an@example.com', 1), ('chi@example.com', 1), ('binh@example.com', 2)`);
await a.q(`insert into requests values (1, 'Xin cấp laptop', 'an@example.com'), (2, 'Đăng ký đào tạo', 'an@example.com'), (3, 'Xin nghỉ phép', 'chi@example.com'), (4, 'Cấp quyền VPN', 'binh@example.com')`);
await a.q(`update departments set name = 'Phòng Nhân sự và Đào tạo' where id = 1`);
await a.q(`select d.name, count(*) from requests r join users u on u.email = r.requester_email join departments d on d.id = u.department_id group by d.name order by 1`);
note('Một câu update sửa đúng một dòng; mọi yêu cầu đều thấy tên mới.');
await a.end();
