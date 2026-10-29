// Dữ liệu dùng chung cho các lab chặng 3: bảng requests có số dòng tùy chọn (mặc định 1 triệu), sinh xác định (không ngẫu nhiên).
// - requester_id: 5.000 người gửi, mỗi người 200 yêu cầu rải đều theo thời gian (1 + (g*7919) % 5000).
// - department_id: suy ra từ requester_id (1 + (requester_id-1) % 20), nên hai cột tương quan hoàn toàn.
// - status: 5% pending, 20% rejected, 75% approved; mỗi người gửi có đủ ba trạng thái (dùng g + g/5000 để trạng thái không phụ thuộc người gửi).
// - created_at: tăng 1 phút mỗi dòng từ 2024-01-01, nên trùng thứ tự vật lý của bảng.
export async function makeRequests(s, schema, n = 1_000_000) {
  const must = async (sql) => { const r = await s.q(sql); if (r.error) throw r.error; return r; };
  await must(`drop schema if exists ${schema} cascade`);
  await must(`create schema ${schema}`);
  await must(`set search_path = ${schema}, public`);
  await must(`create table requests (
    id bigint primary key,
    requester_id integer not null,
    department_id integer not null,
    status text not null,
    created_at timestamptz not null,
    title text not null)`);
  await must(`insert into requests
    select g,
           1 + (g::bigint * 7919) % 5000,
           1 + ((g::bigint * 7919) % 5000) % 20,
           case when (g + g / 5000) % 20 = 0 then 'pending' when (g + g / 5000) % 4 = 0 then 'rejected' else 'approved' end,
           timestamptz '2024-01-01 00:00+07' + g * interval '1 minute',
           'Yêu cầu số ' || g
    from generate_series(1, ${n}) g`);
  await must(`select count(*) as so_dong, count(distinct requester_id) as so_nguoi_gui,
    round(100.0 * count(*) filter (where status = 'pending') / count(*), 1) as pct_pending,
    round(100.0 * count(*) filter (where status = 'approved') / count(*), 1) as pct_approved,
    pg_size_pretty(pg_relation_size('requests')) as kich_thuoc_bang
    from requests`);
}
