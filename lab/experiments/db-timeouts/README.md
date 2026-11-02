# Thử nghiệm: db-timeouts

**Câu hỏi.** Mỗi loại timeout dừng cái gì, ở đâu, và sau đó kết nối, transaction còn dùng được không? Khi client bỏ cuộc thì server có dừng không?

**Môi trường.** PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2) trong container `postgres:16` của lab, Docker Desktop trên máy Lam (Windows 11); client Node.js v25.2.1 với driver `pg` 8.16.3. Chạy ngày 02/11/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc PostgreSQL 16 có sẵn: đặt PGPORT (và PGUSER, PGPASSWORD, PGDATABASE nếu khác lab) cho khớp
npm install
node experiments/db-timeouts/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- `statement_timeout` mặc định `0`. Đặt `300ms`, `pg_sleep(2)` bị hủy sau khoảng 300 ms với `57014`; kết nối vẫn dùng được.
- Trong transaction, câu lệnh bị hủy làm các câu sau báo `25P02` tới khi rollback; `update` trước đó không còn. Sau rollback, `set local` không còn tác dụng: `show statement_timeout` trả `0`.
- `lock_timeout = 300ms`: câu `update` chờ khóa dòng bị hủy sau khoảng 300 ms với `55P03`.
- `idle_in_transaction_session_timeout = 300ms`: phiên nghỉ trong transaction bị kết thúc với `25P03`, `update` chưa commit không còn, `pg_stat_activity` không còn phiên đó, và client không dùng lại được.
- Tham số `statement_timeout: 300` của driver làm `show statement_timeout` trả `300ms`, và câu lệnh chậm bị server hủy với `57014`.
- `query_timeout: 300` của driver: client báo `Query read timeout` sau khoảng 300 ms, trong khi `pg_stat_activity` vẫn cho thấy phiên đó `active` với `select pg_sleep(3)`. `pg_cancel_backend` trả `true`, và phiên về `idle`.
- Pool `max: 1`, `connectionTimeoutMillis: 300`: khi client duy nhất đang được mượn, lần lấy thứ hai lỗi `timeout exceeded when trying to connect` sau khoảng 300 ms.
- Client đang được mượn từ pool, chưa gắn `client.on('error')`, bị kết thúc vì `idle_in_transaction_session_timeout`: `pool.on('error')` không chạy, và tiến trình nhận `uncaughtException` với `25P03`.

**Giới hạn của kết luận.**

- Dùng `pg_sleep` để giả một câu lệnh chậm; không đo tải thật.
- Mốc thời gian là một lần chạy; bài chỉ dùng thứ tự và thứ bậc lớn của chúng.
- PostgreSQL 16 không có `transaction_timeout`, nên lab không thử.
- Không thử mất mạng giữa chừng, nơi kết nối treo chứ không có lỗi trả về.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# Timeout và hủy truy vấn trên PostgreSQL
Máy chủ: PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2) on x86_64-pc-linux-gnu, compiled by gcc (Debian 14.2.0-19) 14.2.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v25.2.1, driver pg 8.16.3
Thời điểm chạy: 2026-11-02T03:34:10.058Z
[A]    45ms  NOTICE: schema "exp_to" does not exist, skipping

## 1. statement_timeout hủy câu lệnh, kết nối vẫn dùng được
[A]    68ms  show statement_timeout
   [A] →
   statement_timeout
   -----------------
   0                
   (1 dòng)
[A]    69ms  set statement_timeout = '300ms'
   [A] → SET
[A]    70ms  select pg_sleep(2)
[A]   371ms  LỖI 57014: canceling statement due to statement timeout
[A]   372ms  select 1 as van_dung_duoc
   [A] →
   van_dung_duoc
   -------------
   1            
   (1 dòng)
[A]   373ms  reset statement_timeout
   [A] → RESET

## 2. Trong transaction, câu lệnh bị hủy làm hỏng cả transaction
[A]   374ms  begin
   [A] → BEGIN
[A]   375ms  update exp_to.t set v = 1 where id = 1
   [A] → UPDATE 1
[A]   376ms  set local statement_timeout = '300ms'
   [A] → SET
[A]   376ms  select pg_sleep(2)
[A]   678ms  LỖI 57014: canceling statement due to statement timeout
[A]   678ms  select 1 as cau_tiep_theo
[A]   680ms  LỖI 25P02: current transaction is aborted, commands ignored until end of transaction block
[A]   680ms  rollback
   [A] → ROLLBACK
[B]   681ms  select v from exp_to.t where id = 1
   [B] →
   v
   -
   0
   (1 dòng)
[A]   682ms  show statement_timeout
   [A] →
   statement_timeout
   -----------------
   0                
   (1 dòng)

## 3. lock_timeout chỉ giới hạn thời gian chờ khóa
[A]   683ms  begin
   [A] → BEGIN
[A]   684ms  update exp_to.t set v = 2 where id = 1
   [A] → UPDATE 1
[B]   685ms  set lock_timeout = '300ms'
   [B] → SET
[B]   686ms  update exp_to.t set v = 3 where id = 1
[B]   988ms  LỖI 55P03: canceling statement due to lock timeout
[B]   988ms  reset lock_timeout
   [B] → RESET
[A]   990ms  rollback
   [A] → ROLLBACK

## 4. idle_in_transaction_session_timeout kết thúc cả phiên
[C]   998ms  set idle_in_transaction_session_timeout = '300ms'
   [C] → SET
[C]   998ms  begin
   [C] → BEGIN
[C]  1000ms  update exp_to.t set v = 4 where id = 1
   [C] → UPDATE 1
-- C nghỉ 800 ms trong transaction đang mở.
[C] sự kiện error của client: 25P03 terminating connection due to idle-in-transaction timeout
[C] sự kiện error của client:  Connection terminated unexpectedly
[B]  1815ms  select v from exp_to.t where id = 1
   [B] →
   v
   -
   0
   (1 dòng)
[B]  1817ms  select count(*) as so_phien_C from pg_stat_activity where application_name = 'lab-C'
   [B] →
   so_phien_c
   ----------
   0         
   (1 dòng)
[C]  1819ms  select 1 as sau_khi_bi_ket_thuc
[C]  1819ms  LỖI undefined: Client has encountered a connection error and is not queryable

## 5. statement_timeout đặt qua cấu hình của driver
[D]  1826ms  show statement_timeout
   [D] →
   statement_timeout
   -----------------
   300ms            
   (1 dòng)
[D]  1827ms  select pg_sleep(2)
[D]  2128ms  LỖI 57014: canceling statement due to statement timeout

## 6. query_timeout của driver: client bỏ cuộc, server vẫn chạy
[E] client nhận kết quả sau khoảng 300 ms: lỗi: Query read timeout
[B]  2447ms  select state, left(query, 30) as cau_lenh from pg_stat_activity where pid = 177
   [B] →
   state  | cau_lenh          
   -------+-------------------
   active | select pg_sleep(3)
   (1 dòng)
-- Server vẫn đang chạy câu lệnh dù client đã báo lỗi. Hủy từ phiên khác bằng pg_cancel_backend.
[B]  2450ms  select pg_cancel_backend(177) as da_gui_tin_hieu
   [B] →
   da_gui_tin_hieu
   ---------------
   true           
   (1 dòng)
[B]  2665ms  select state, left(query, 30) as cau_lenh from pg_stat_activity where pid = 177
   [B] →
   state | cau_lenh          
   ------+-------------------
   idle  | select pg_sleep(3)
   (1 dòng)

## 7. connectionTimeoutMillis của pool: chờ lấy kết nối có giới hạn
[pool] lần lấy thứ hai sau khoảng 300 ms: lỗi: timeout exceeded when trying to connect

## 8. Client mượn từ pool bị kết thúc khi đang giữ: lỗi không đi qua pool.on(error)
-- Client đang được mượn, chưa gắn client.on(error), nghỉ trong transaction.
[tiến trình] uncaughtException: 25P03 terminating connection due to idle-in-transaction timeout
[A]  3288ms  NOTICE: drop cascades to table exp_to.t
```
