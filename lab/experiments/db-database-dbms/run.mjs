// Cùng chuẩn SQL nhưng khác hành vi: PostgreSQL coi chuỗi rỗng là một giá trị, không phải NULL.
// Tài liệu Oracle (Release 26) ghi rằng Oracle hiện coi chuỗi rỗng là NULL; thử nghiệm này chỉ chạy được phần PostgreSQL.
import { header, session, step, note } from '../../lib/harness.mjs';

await header('Chuỗi rỗng và NULL trên PostgreSQL');
const a = await session('A');
await a.q('drop schema if exists exp_dbms cascade');
await a.q('create schema exp_dbms');
await a.q('set search_path = exp_dbms');

step('1. Chuỗi rỗng có phải NULL không');
await a.q(`select '' is null as chuoi_rong_la_null, length('') as do_dai`);

step('2. Cột NOT NULL nhận chuỗi rỗng');
await a.q(`create table requests (id integer primary key, title text not null)`);
await a.q(`insert into requests values (1, '')`);
await a.q(`select count(*) filter (where title is null) as so_dong_null, count(*) filter (where title = '') as so_dong_rong from requests`);
note('Trên PostgreSQL, chuỗi rỗng qua được NOT NULL. Phần Oracle chưa chạy trong lab này; xem README.');
await a.end();
