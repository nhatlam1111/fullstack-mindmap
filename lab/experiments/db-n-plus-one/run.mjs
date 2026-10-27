// Đếm số truy vấn và thời gian: N+1, IN (2 truy vấn) và JOIN (1 truy vấn) khi lấy 50 yêu cầu kèm người gửi.
import { header, session, step, note } from '../../lib/harness.mjs';

await header('Vấn đề N+1');
const s = await session('app');
await s.q('drop schema if exists exp_n1 cascade');
await s.q('create schema exp_n1');
await s.q('set search_path = exp_n1');
await s.q(`create table users (id integer primary key, full_name text not null)`);
await s.q(`create table requests (id integer primary key, requester_id integer not null references users, title text not null, created_at timestamptz not null)`);
await s.q(`insert into users select g, 'Nhân viên ' || g from generate_series(1, 500) g`);
await s.q(`insert into requests select g, 1 + (g % 500), 'Yêu cầu ' || g, now() - (g || ' minutes')::interval from generate_series(1, 20000) g`);
await s.q(`analyze`);

let count = 0;
const run = (sql, params) => { count++; return s.client.query(sql, params); };
const time = async (label, fn, rounds = 20) => {
  await fn();
  count = 0;
  const t = performance.now();
  for (let i = 0; i < rounds; i++) await fn();
  const ms = (performance.now() - t) / rounds;
  console.log(`-- ${label}: ${count / rounds} truy vấn, trung bình ${ms.toFixed(2)} ms mỗi lần tải trang`);
  return ms;
};

const measureAll = async () => {
  const n1 = await time('N+1', async () => {
    const r = await run(`select id, requester_id, title from requests order by created_at desc limit 50`);
    for (const row of r.rows) await run(`select full_name from users where id = $1`, [row.requester_id]);
  });
  const two = await time('IN (2 truy vấn)', async () => {
    const r = await run(`select id, requester_id, title from requests order by created_at desc limit 50`);
    const ids = [...new Set(r.rows.map((x) => x.requester_id))];
    await run(`select id, full_name from users where id = any($1)`, [ids]);
  });
  const join = await time('JOIN (1 truy vấn)', async () => {
    await run(`select r.id, r.title, u.full_name from requests r join users u on u.id = r.requester_id order by r.created_at desc limit 50`);
  });
  return { n1, two, join };
};

step('1. Ba cách lấy 50 yêu cầu mới nhất kèm tên người gửi, chưa có index trên created_at (đo 20 lần)');
const before = await measureAll();
note(`N+1 chậm hơn JOIN khoảng ${(before.n1 / before.join).toFixed(1)} lần ngay trên localhost.`);
await s.q(`explain (analyze, costs off, timing off, summary off) select id, requester_id, title from requests order by created_at desc limit 50`);
await s.q(`explain (analyze, costs off, timing off, summary off) select r.id, r.title, u.full_name from requests r join users u on u.id = r.requester_id order by r.created_at desc limit 50`);
note('Không có index cho order by created_at, JOIN phải nối và sắp xếp trên cả bảng trước khi lấy 50 dòng.');

step('2. Thêm index trên created_at rồi đo lại');
await s.q(`create index requests_created_at_idx on requests (created_at)`);
await s.q(`analyze requests`);
const after = await measureAll();
await s.q(`explain (analyze, costs off, timing off, summary off) select r.id, r.title, u.full_name from requests r join users u on u.id = r.requester_id order by r.created_at desc limit 50`);
note(`Sau khi có index: N+1 chậm hơn JOIN khoảng ${(after.n1 / after.join).toFixed(1)} lần.`);
note('Thử nghiệm chạy trên localhost. Qua mạng, mỗi truy vấn còn thêm một vòng đi-về giữa ứng dụng và database; phần này không được đo ở đây.');
await s.end();
