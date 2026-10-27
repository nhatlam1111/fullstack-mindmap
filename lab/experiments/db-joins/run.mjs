// Join trên PostgreSQL: inner và left join, điều kiện đặt ở ON hay WHERE, nhân dòng khi join nhiều bảng, và thuật toán join planner chọn.
import { header, session, step, note } from '../../lib/harness.mjs';

await header('Join trên PostgreSQL');
const s = await session('app');
await s.q('drop schema if exists exp_join cascade');
await s.q('create schema exp_join');
await s.q('set search_path = exp_join');
await s.q(`create table departments (id integer primary key, name text not null)`);
await s.q(`create table users (id integer primary key, full_name text not null, department_id integer references departments)`);
await s.q(`create table requests (id integer primary key, requester_id integer not null references users, status text not null)`);
await s.q(`insert into departments values (1, 'Nhân sự'), (2, 'Kỹ thuật'), (3, 'Kế toán')`);
await s.q(`insert into users values (1, 'An', 1), (2, 'Bình', 2), (3, 'Chi', 2), (4, 'Dũng', null)`);
await s.q(`insert into requests values (1, 1, 'pending'), (2, 1, 'approved'), (3, 2, 'approved'), (4, 2, 'approved'), (5, 4, 'pending')`);
note('Chi không có yêu cầu nào; Dũng chưa thuộc phòng ban nào; phòng Kế toán chưa có ai.');

step('1. Inner join: chỉ giữ người dùng có ít nhất một yêu cầu');
await s.q(`select u.full_name, r.id as request_id, r.status from users u join requests r on r.requester_id = u.id order by u.id, r.id`);

step('2. Left join: giữ mọi người dùng, cột của requests là NULL khi không khớp');
await s.q(`select u.full_name, r.id as request_id, r.status from users u left join requests r on r.requester_id = u.id order by u.id, r.id`);

step('3. Điều kiện trên bảng bên phải: đặt ở WHERE so với đặt ở ON');
await s.q(`select u.full_name, count(r.id) as pending from users u left join requests r on r.requester_id = u.id where r.status = 'pending' group by u.id, u.full_name order by u.id`);
await s.q(`select u.full_name, count(r.id) as pending from users u left join requests r on r.requester_id = u.id and r.status = 'pending' group by u.id, u.full_name order by u.id`);
note('Đặt ở WHERE: lọc sau khi join, nên mất người không có yêu cầu pending. Đặt ở ON: lọc trước khi join, mọi người dùng còn lại với số 0.');

step('4. Nhân dòng: đếm người dùng của mỗi phòng sau khi join thêm requests');
await s.q(`select d.name, count(u.id) as so_nguoi from departments d left join users u on u.department_id = d.id group by d.id, d.name order by d.id`);
await s.q(`select d.name, count(u.id) as so_nguoi_sai, count(distinct u.id) as so_nguoi_dung from departments d left join users u on u.department_id = d.id left join requests r on r.requester_id = u.id group by d.id, d.name order by d.id`);
note('Mỗi người dùng xuất hiện một lần cho mỗi yêu cầu của họ, nên count(u.id) đếm trùng.');

step('5. Quên điều kiện nối');
await s.q(`select count(*) as so_dong from departments d, users u`);
note('FROM viết bằng dấu phẩy mà không có điều kiện nối: 3 phòng ban × 4 người dùng = 12 dòng.');
await s.q(`select d.name, u.full_name from departments d join users u`);
note('Với cú pháp JOIN, thiếu ON thì PostgreSQL báo lỗi cú pháp thay vì trả về tích Descartes.');

step('6. Thuật toán join: dữ liệu lớn hơn, có và không có điều kiện chọn một người');
await s.q(`insert into users select g, 'User ' || g, 1 + g % 3 from generate_series(5, 5000) g`);
await s.q(`insert into requests select g, 1 + g % 5000, case when g % 4 = 0 then 'pending' else 'approved' end from generate_series(6, 200000) g`);
await s.q(`create index requests_requester_idx on requests (requester_id)`);
await s.q('analyze');
await s.q(`explain (analyze, costs off, timing off, summary off) select u.full_name, r.status from users u join requests r on r.requester_id = u.id`);
await s.q(`explain (analyze, costs off, timing off, summary off) select u.full_name, r.status from users u join requests r on r.requester_id = u.id where u.id = 7`);
note('Join cả hai bảng: planner chọn hash join. Chỉ một người dùng: planner chọn nested loop dùng index của requests.');
await s.end();
