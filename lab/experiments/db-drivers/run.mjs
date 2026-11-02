// Driver và client: mỗi kết nối là một backend, hai dạng giao thức truy vấn, và cách driver pg đổi kiểu dữ liệu sang JavaScript.
import { header, session, step, note } from '../../lib/harness.mjs';

await header('Driver và client trên PostgreSQL');
const A = await session('A');
const B = await session('B');

step('1. Mỗi kết nối là một tiến trình backend riêng');
await A.q(`select pg_backend_pid() as pid`);
await B.q(`select pg_backend_pid() as pid`);
await A.q(`select application_name, backend_type, state from pg_stat_activity where application_name like 'lab-%' order by application_name`);
note(`Driver pg giữ process ID và secret key nhận ở lúc khởi động (BackendKeyData): processID = ${A.client.processID}, có secretKey: ${A.client.secretKey != null}`);

step('2. Không có tham số: giao thức simple nhận nhiều câu lệnh trong một chuỗi');
const nhieu = await A.client.query(`select 1 as a; select 2 as b`);
console.log(`[A] select 1 as a; select 2 as b → ${nhieu.length} bộ kết quả: ${JSON.stringify(nhieu.map((x) => x.rows))}`);

step('3. Có tham số: giao thức extended chỉ nhận một câu lệnh');
await A.q(`select $1::int as a; select 2 as b`, [1]);
await A.q(`select $1::int as a`, [1]);

step('4. Kiểu dữ liệu sau khi qua driver');
const r = await A.q(`select
  1::int4 as so_int4,
  9007199254740993::int8 as so_int8,
  1.10::numeric(10,2) as so_numeric,
  0.1::float8 as so_float8,
  true as gia_tri_bool,
  timestamptz '2026-01-02 03:04:05.123456+07' as thoi_diem,
  jsonb '{"a":1}' as du_lieu_json,
  array[1,2]::int[] as mang,
  gen_random_uuid() is not null as co_uuid`);
const row = r.rows[0];
for (const [k, v] of Object.entries(row)) {
  const kieu = v instanceof Date ? 'Date' : Array.isArray(v) ? 'Array' : typeof v;
  console.log(`   ${k}: typeof = ${kieu}, giá trị = ${JSON.stringify(v)}`);
}

step('5. Đổi int8 sang Number làm mất chính xác; numeric giữ được chữ số 0 ở cuối khi còn là chuỗi');
console.log(`   chuỗi từ driver: ${row.so_int8}`);
console.log(`   Number(chuỗi): ${Number(row.so_int8)}`);
console.log(`   BigInt(chuỗi): ${BigInt(row.so_int8)}`);
console.log(`   numeric dạng chuỗi: ${row.so_numeric}; Number(chuỗi): ${Number(row.so_numeric)}`);

step('6. timestamptz có micro giây, Date của JavaScript chỉ giữ tới mili giây');
await A.q(`select timestamptz '2026-01-02 03:04:05.123456+07'::text as chuoi_goc`);
console.log(`   Date sau khi qua driver: ${row.thoi_diem.toISOString()}`);

await A.end();
await B.end();
