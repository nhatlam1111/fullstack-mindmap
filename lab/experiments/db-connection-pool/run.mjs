// Chi phí mở kết nối mới so với dùng lại kết nối từ pool, và điều gì xảy ra khi vượt max_connections.
import pg from 'pg';
import { header, session, step, note, config } from '../../lib/harness.mjs';

await header('Connection pool trên PostgreSQL');
const admin = await session('admin');
await admin.q(`do $$ begin if not exists (select from pg_roles where rolname = 'lab_app') then create role lab_app login password 'lab_app'; end if; end $$`);
await admin.q(`grant connect on database ${config.database} to lab_app`);
await admin.q(`show max_connections`);
await admin.q(`show superuser_reserved_connections`);
await admin.q(`show reserved_connections`);
await admin.q(`select ssl from pg_stat_ssl where pid = pg_backend_pid()`);
const probe = await session('probe', { user: 'lab_app', password: 'lab_app' });
await probe.q('select system_user');
note('system_user cho biết phương thức xác thực mà kết nối của lab_app đã dùng.');
await probe.end();
const N = 200;

step(`1. Mở kết nối mới cho mỗi truy vấn, ${N} lần`);
let t = performance.now();
for (let i = 0; i < N; i++) {
  const c = new pg.Client({ ...config, user: 'lab_app', password: 'lab_app' });
  await c.connect();
  await c.query('select 1');
  await c.end();
}
const fresh = (performance.now() - t) / N;
console.log(`-- trung bình ${fresh.toFixed(2)} ms mỗi lần (kết nối + truy vấn + đóng)`);

step(`2. Dùng lại kết nối từ pool (max 5), ${N} lần`);
const pool = new pg.Pool({ ...config, user: 'lab_app', password: 'lab_app', max: 5 });
await pool.query('select 1');
t = performance.now();
for (let i = 0; i < N; i++) await pool.query('select 1');
const pooled = (performance.now() - t) / N;
console.log(`-- trung bình ${pooled.toFixed(2)} ms mỗi lần`);
console.log(`-- chênh lệch: khoảng ${(fresh / pooled).toFixed(0)} lần, chỉ tính trên localhost (chưa có độ trễ mạng hay TLS)`);
await pool.end();

step('3. Giữ kết nối tới khi máy chủ từ chối');
const held = [];
let failed = null;
for (let i = 0; i < 150; i++) {
  const c = new pg.Client({ ...config, user: 'lab_app', password: 'lab_app' });
  try { await c.connect(); held.push(c); } catch (e) { failed = e; break; }
}
const others = await admin.q(`select count(*) as tong_ket_noi_dang_mo from pg_stat_activity where backend_type = 'client backend'`);
console.log(`-- mở được ${held.length} kết nối của lab_app; kết nối tiếp theo bị từ chối:`);
console.log(`   LỖI ${failed?.code}: ${failed?.message}`);
note(`Ngoài ra còn ${Number(others.rows[0].tong_ket_noi_dang_mo) - held.length} kết nối khác đang mở (của phiên admin).`);
for (const c of held) await c.end();
await admin.end();
