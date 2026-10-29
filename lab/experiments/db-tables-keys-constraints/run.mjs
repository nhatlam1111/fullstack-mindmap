// Database tự từ chối dữ liệu sai khi có constraint. Schema tối giản chỉ để thử nghiệm, không phải lời giải bài thực hành ở chặng 1.
import { header, session, step } from '../../lib/harness.mjs';

await header('Constraint chặn dữ liệu sai');
const a = await session('A');
await a.q('drop schema if exists exp_constraints cascade');
await a.q('create schema exp_constraints');
await a.q('set search_path = exp_constraints');

step('Tạo bảng với primary key, foreign key, unique, check');
await a.q(`create table departments (
  id   integer generated always as identity primary key,
  name text not null unique)`);
await a.q(`create table users (
  id            integer generated always as identity primary key,
  email         text not null unique,
  department_id integer not null references departments on delete restrict,
  role          text not null check (role in ('employee', 'manager', 'admin')))`);
await a.q(`create table requests (
  id           bigint generated always as identity primary key,
  requester_id integer not null references users,
  title        text not null check (length(title) between 3 and 200),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')))`);

step('Dữ liệu hợp lệ');
await a.q(`insert into departments (name) values ('Nhân sự'), ('Kỹ thuật') returning id, name`);
await a.q(`insert into users (email, department_id, role) values ('an@example.com', 1, 'employee'), ('binh@example.com', 2, 'manager') returning id, email`);
await a.q(`insert into requests (requester_id, title) values (1, 'Xin cấp laptop') returning id, status`);

step('Vi phạm foreign key: người gửi không tồn tại');
await a.q(`insert into requests (requester_id, title) values (999, 'Yêu cầu của người không tồn tại')`);

step('Vi phạm check: trạng thái không có trong danh sách');
await a.q(`update requests set status = 'done' where id = 1`);

step('Vi phạm unique: email trùng');
await a.q(`insert into users (email, department_id, role) values ('an@example.com', 2, 'employee')`);

step('Vi phạm not null');
await a.q(`insert into requests (requester_id, title) values (null, 'Không có người gửi')`);

step('Xóa phòng ban vẫn còn nhân viên (on delete restrict)');
await a.q(`delete from departments where id = 1`);

step('Dữ liệu sau các lần thử: không có dòng sai nào lọt vào');
await a.q(`select r.id, r.title, r.status, u.email from requests r join users u on u.id = r.requester_id`);
await a.q(`select count(*) as so_nhan_vien from users`);

step('Foreign key không tự tạo index ở cột tham chiếu');
await a.q(`select tablename, indexname from pg_indexes where schemaname = 'exp_constraints' order by tablename, indexname`);
step('CHECK chấp nhận NULL khi cột cho phép NULL');
await a.q(`create table check_nullable (status text check (status in ('pending', 'approved')))`);
await a.q(`insert into check_nullable values (null)`);
await a.q(`insert into check_nullable values ('done')`);
await a.q(`select count(*) as so_dong, count(status) as so_dong_co_status from check_nullable`);

step('ON DELETE CASCADE: thẻ lệnh DELETE chỉ đếm dòng ở bảng bị xóa');
await a.q(`create table cascade_parent (id integer primary key)`);
await a.q(`create table cascade_child (id integer generated always as identity primary key, parent_id integer not null references cascade_parent on delete cascade)`);
await a.q(`insert into cascade_parent values (1)`);
await a.q(`insert into cascade_child (parent_id) select 1 from generate_series(1, 50)`);
await a.q(`delete from cascade_parent where id = 1`);
await a.q(`select count(*) as so_dong_con_lai from cascade_child`);

step('UNIQUE nhiều cột khi một cột là NULL');
await a.q(`create table uq_default (a integer, b integer, unique (a, b))`);
await a.q(`insert into uq_default values (1, null), (1, null)`);
await a.q(`select count(*) as so_dong from uq_default`);
await a.q(`create table uq_nulls_not_distinct (a integer, b integer, unique nulls not distinct (a, b))`);
await a.q(`insert into uq_nulls_not_distinct values (1, null)`);
await a.q(`insert into uq_nulls_not_distinct values (1, null)`);

step('Vi phạm constraint bên trong một transaction');
await a.q('begin');
await a.q(`insert into departments (name) values ('Nhân sự')`);
await a.q(`select 1 as cau_lenh_tiep_theo`);
await a.q('rollback');

await a.end();
