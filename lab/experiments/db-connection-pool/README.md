# Thử nghiệm: db-connection-pool

**Câu hỏi.** Mở kết nối mới cho mỗi truy vấn tốn bao nhiêu so với dùng lại kết nối từ pool? Điều gì xảy ra khi vượt `max_connections`?

**Môi trường.** PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1), cài sẵn trong môi trường build Linux của Claude; client Node.js v22.22.0 với driver `pg` 8.16.3. Chạy ngày 15/10/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc dùng PostgreSQL 16 có sẵn
npm install
node experiments/db-connection-pool/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- Ở lần chạy dưới đây: mở kết nối + `select 1` + đóng, 200 lần tuần tự từ một client, trung bình 9,57 ms; cùng truy vấn qua `pg.Pool` (max 5) trung bình 0,19 ms. Số tuyệt đối thay đổi giữa các lần chạy (lần chạy ngày 14/10 đo được 11,29 ms và 0,20 ms).
- Kết nối localhost không dùng TLS (`ssl = false`), và `system_user` của role `lab_app` là `scram-sha-256:lab_app`, tức xác thực bằng SCRAM-SHA-256.
- Với `max_connections = 100`, `superuser_reserved_connections = 3`, `reserved_connections = 0`, role thường mở được 96 kết nối (cộng 1 kết nối admin là 97); kết nối tiếp theo bị từ chối với 53300.

**Giới hạn của kết luận.**

- Đo trên localhost qua TCP, xác thực scram-sha-256 (pg_hba.conf mặc định của gói Ubuntu), không TLS (`ssl = false`); chưa đo qua mạng hay với TLS.
- Truy vấn rất ngắn (`select 1`), nên chi phí kết nối chiếm gần hết thời gian; với truy vấn dài, tỷ lệ này nhỏ hơn.
- Không đo kích thước pool tối ưu; việc đó cần tải giống production.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Connection pool trên PostgreSQL
Máy chủ: PostgreSQL 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v22.22.0, driver pg 8.16.3
Thời điểm chạy: 2026-10-15T02:41:41.695Z
[admin]    39ms  do $$ begin if not exists (select from pg_roles where rolname = 'lab_app') then create role lab_app login password 'lab_app'; end if; end $$
   [admin] → DO
[admin]    45ms  grant connect on database lab to lab_app
   [admin] → GRANT
[admin]    46ms  show max_connections
   [admin] →
   max_connections
   ---------------
   100            
   (1 dòng)
[admin]    47ms  show superuser_reserved_connections
   [admin] →
   superuser_reserved_connections
   ------------------------------
   3                             
   (1 dòng)
[admin]    47ms  show reserved_connections
   [admin] →
   reserved_connections
   --------------------
   0                   
   (1 dòng)
[admin]    48ms  select ssl from pg_stat_ssl where pid = pg_backend_pid()
   [admin] →
   ssl  
   -----
   false
   (1 dòng)
[probe]    56ms  select system_user
   [probe] →
   system_user          
   ---------------------
   scram-sha-256:lab_app
   (1 dòng)
-- system_user cho biết phương thức xác thực mà kết nối của lab_app đã dùng.

## 1. Mở kết nối mới cho mỗi truy vấn, 200 lần
-- trung bình 9.57 ms mỗi lần (kết nối + truy vấn + đóng)

## 2. Dùng lại kết nối từ pool (max 5), 200 lần
-- trung bình 0.19 ms mỗi lần
-- chênh lệch: khoảng 49 lần, chỉ tính trên localhost (chưa có độ trễ mạng hay TLS)

## 3. Giữ kết nối tới khi máy chủ từ chối
[admin]  2755ms  select count(*) as tong_ket_noi_dang_mo from pg_stat_activity where backend_type = 'client backend'
   [admin] →
   tong_ket_noi_dang_mo
   --------------------
   97                  
   (1 dòng)
-- mở được 96 kết nối của lab_app; kết nối tiếp theo bị từ chối:
   LỖI 53300: remaining connection slots are reserved for roles with the SUPERUSER attribute
-- Ngoài ra còn 1 kết nối khác đang mở (của phiên admin).
```
