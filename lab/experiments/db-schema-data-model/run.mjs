// Schema trên PostgreSQL là không gian tên: cùng tên bảng ở hai schema, search_path quyết định tên không kèm schema trỏ tới bảng nào.
import { header, session, step, note } from '../../lib/harness.mjs';

await header('Schema là không gian tên trên PostgreSQL');
const s = await session('app');
await s.q('drop schema if exists exp_hr cascade');
await s.q('drop schema if exists exp_it cascade');
await s.q('create schema exp_hr');
await s.q('create schema exp_it');
await s.q(`create table exp_hr.requests (id integer primary key, title text not null)`);
await s.q(`create table exp_it.requests (id integer primary key, title text not null, device text)`);
await s.q(`insert into exp_hr.requests values (1, 'Xin nghỉ phép')`);
await s.q(`insert into exp_it.requests values (1, 'Xin cấp laptop', 'laptop')`);
note('Hai bảng cùng tên requests nằm ở hai schema khác nhau, cấu trúc khác nhau.');

step('1. search_path mặc định của phiên');
await s.q('show search_path');

step('2. Tên không kèm schema khi không schema nào trên search_path có bảng requests');
await s.q('select * from requests');

step('3. Cùng một câu lệnh, đổi search_path thì trỏ tới bảng khác');
await s.q('set search_path = exp_hr, public');
await s.q('select * from requests');
await s.q('set search_path = exp_it, exp_hr, public');
await s.q('select * from requests');
note('Schema đầu tiên trên search_path có bảng requests được dùng.');

step('4. Tên đầy đủ schema.bảng không phụ thuộc search_path');
await s.q('select * from exp_hr.requests');

step('5. Cấu trúc của hai bảng đọc được từ catalog information_schema');
await s.q(`select table_schema, table_name, column_name, data_type, is_nullable
  from information_schema.columns
  where table_name = 'requests' and table_schema in ('exp_hr', 'exp_it')
  order by table_schema, ordinal_position`);

step('6. Role thường (không phải chủ database, không phải superuser) tạo bảng không ghi schema');
await s.q(`do $$ begin if not exists (select from pg_roles where rolname = 'lab_schema_user') then create role lab_schema_user login password 'lab_schema_user'; end if; end $$`);
await s.q(`select rolname, rolsuper from pg_roles where rolname = 'lab_schema_user'`);
await s.q(`select has_schema_privilege('lab_schema_user', 'public', 'CREATE') as create_tren_public`);
const u = await session('user', { user: 'lab_schema_user', password: 'lab_schema_user' });
await u.q('show search_path');
await u.q('create table new_requests (id integer)');
note('Database lab được tạo mới trên PostgreSQL 16, không nâng cấp từ bản 14 trở về trước.');
await u.end();
await s.end();
