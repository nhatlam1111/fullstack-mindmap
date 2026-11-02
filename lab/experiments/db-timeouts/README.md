# Thử nghiệm: db-timeouts

**Câu hỏi.** Mỗi loại timeout dừng cái gì, ở đâu, và sau đó kết nối, transaction còn dùng được không? Khi client bỏ cuộc thì server có dừng không?

**Môi trường.** PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2) trong container `postgres:16` của lab, Docker Desktop trên máy Lam (Windows 11); client Node.js v24.22.2 với driver `pg` 8.16.3, `pg-pool` 3.14.0. Chạy ngày 02/11/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc PostgreSQL 16 có sẵn: đặt PGPORT (và PGUSER, PGPASSWORD, PGDATABASE nếu khác lab) cho khớp
npm install
node experiments/db-timeouts/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- `statement_timeout` mặc định `0`. Đặt `300ms`, `pg_sleep(2)` bị hủy sau khoảng 300 ms với `57014`; kết nối vẫn dùng được.
- Trong transaction, câu lệnh bị hủy làm các câu sau báo `25P02` tới khi rollback; `update` trước đó không còn.
- `lock_timeout = 300ms`: câu `update` chờ khóa dòng bị hủy sau khoảng 300 ms với `55P03`.
- `idle_in_transaction_session_timeout = 300ms`: phiên nghỉ trong transaction bị kết thúc với `25P03`, `update` chưa commit không còn, `pg_stat_activity` không còn phiên đó, và client không dùng lại được.
- Tham số `statement_timeout: 300` của driver làm `show statement_timeout` trả `300ms`, và câu lệnh chậm bị server hủy với `57014`.
- `query_timeout: 300` của driver: client báo `Query read timeout` sau khoảng 300 ms, trong khi `pg_stat_activity` vẫn cho thấy phiên đó `active` với `select pg_sleep(3)`. `pg_cancel_backend` trả `true`, và phiên về `idle`.
- Pool `max: 1`, `connectionTimeoutMillis: 300`: khi client duy nhất đang được mượn, lần lấy thứ hai lỗi `timeout exceeded when trying to connect` sau khoảng 300 ms; client đang giữ vẫn chạy được câu tiếp theo.
- Client đang được mượn từ pool, chưa gắn `client.on('error')`, bị kết thúc vì `idle_in_transaction_session_timeout`: `pool.on('error')` không chạy, và tiến trình nhận `uncaughtException` với `25P03`.
- `set local` trong transaction: sau `commit`, `show statement_timeout` trả `0`. `set` thường: sau `rollback` trả `0`, sau `commit` trả `300ms`. Vì vậy chỉ `commit` mới phân biệt được hai lệnh.

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
Client: Node.js v24.22.2, driver pg 8.16.3
Thời điểm chạy: 2026-11-02T08:10:05.589Z
[A]    56ms  NOTICE: schema "exp_to" does not exist, skipping

## 1. statement_timeout hủy câu lệnh, kết nối vẫn dùng được
[A]    83ms  show statement_timeout
   [A] →
   statement_timeout
   -----------------
   0                
   (1 dòng)
[A]    84ms  set statement_timeout = '300ms'
   [A] → SET
[A]    85ms  select pg_sleep(2)
[A]   387ms  LỖI 57014: canceling statement due to statement timeout
[A]   387ms  select 1 as van_dung_duoc
   [A] →
   van_dung_duoc
   -------------
   1            
   (1 dòng)
[A]   388ms  reset statement_timeout
   [A] → RESET

## 2. Trong transaction, câu lệnh bị hủy làm hỏng cả transaction
[A]   389ms  begin
   [A] → BEGIN
[A]   390ms  update exp_to.t set v = 1 where id = 1
   [A] → UPDATE 1
[A]   396ms  set local statement_timeout = '300ms'
   [A] → SET
[A]   396ms  select pg_sleep(2)
[A]   698ms  LỖI 57014: canceling statement due to statement timeout
[A]   698ms  select 1 as cau_tiep_theo
[A]   700ms  LỖI 25P02: current transaction is aborted, commands ignored until end of transaction block
[A]   700ms  rollback
   [A] → ROLLBACK
[B]   701ms  select v from exp_to.t where id = 1
   [B] →
   v
   -
   0
   (1 dòng)
[A]   702ms  show statement_timeout
   [A] →
   statement_timeout
   -----------------
   0                
   (1 dòng)

## 3. lock_timeout chỉ giới hạn thời gian chờ khóa
[A]   703ms  begin
   [A] → BEGIN
[A]   704ms  update exp_to.t set v = 2 where id = 1
   [A] → UPDATE 1
[B]   705ms  set lock_timeout = '300ms'
   [B] → SET
[B]   706ms  update exp_to.t set v = 3 where id = 1
[B]  1007ms  LỖI 55P03: canceling statement due to lock timeout
[B]  1007ms  reset lock_timeout
   [B] → RESET
[A]  1009ms  rollback
   [A] → ROLLBACK

## 4. idle_in_transaction_session_timeout kết thúc cả phiên
[C]  1016ms  set idle_in_transaction_session_timeout = '300ms'
   [C] → SET
[C]  1017ms  begin
   [C] → BEGIN
[C]  1018ms  update exp_to.t set v = 4 where id = 1
   [C] → UPDATE 1
-- C nghỉ 800 ms trong transaction đang mở.
[C] sự kiện error của client: 25P03 terminating connection due to idle-in-transaction timeout
[C] sự kiện error của client:  Connection terminated unexpectedly
[B]  1829ms  select v from exp_to.t where id = 1
   [B] →
   v
   -
   0
   (1 dòng)
[B]  1831ms  select count(*) as so_phien_C from pg_stat_activity where application_name = 'lab-C'
   [B] →
   so_phien_c
   ----------
   0         
   (1 dòng)
[C]  1837ms  select 1 as sau_khi_bi_ket_thuc
[C]  1837ms  LỖI undefined: Client has encountered a connection error and is not queryable

## 5. statement_timeout đặt qua cấu hình của driver
[D]  1844ms  show statement_timeout
   [D] →
   statement_timeout
   -----------------
   300ms            
   (1 dòng)
[D]  1845ms  select pg_sleep(2)
[D]  2146ms  LỖI 57014: canceling statement due to statement timeout

## 6. query_timeout của driver: client bỏ cuộc, server vẫn chạy
[E] client nhận kết quả sau khoảng 300 ms: lỗi: Query read timeout
[B]  2473ms  select state, left(query, 30) as cau_lenh from pg_stat_activity where pid = 59
   [B] →
   state  | cau_lenh          
   -------+-------------------
   active | select pg_sleep(3)
   (1 dòng)
-- Server vẫn đang chạy câu lệnh dù client đã báo lỗi. Hủy từ phiên khác bằng pg_cancel_backend.
[B]  2477ms  select pg_cancel_backend(59) as da_gui_tin_hieu
   [B] →
   da_gui_tin_hieu
   ---------------
   true           
   (1 dòng)
[B]  2688ms  select state, left(query, 30) as cau_lenh from pg_stat_activity where pid = 59
   [B] →
   state | cau_lenh          
   ------+-------------------
   idle  | select pg_sleep(3)
   (1 dòng)

## 7. connectionTimeoutMillis của pool: chờ lấy kết nối có giới hạn
[pool] lần lấy thứ hai sau khoảng 300 ms: lỗi: timeout exceeded when trying to connect
[pool] client đang giữ chạy tiếp được: {"van_chay":1}

## 8. Client mượn từ pool bị kết thúc khi đang giữ: lỗi không đi qua pool.on(error)
-- Client đang được mượn, chưa gắn client.on(error), nghỉ trong transaction.
[tiến trình] uncaughtException: 25P03 terminating connection due to idle-in-transaction timeout

## 9. set local hết tác dụng khi transaction kết thúc; set thường giữ lại sau commit
[A]  3309ms  begin
   [A] → BEGIN
[A]  3310ms  set local statement_timeout = '300ms'
   [A] → SET
[A]  3311ms  show statement_timeout
   [A] →
   statement_timeout
   -----------------
   300ms            
   (1 dòng)
[A]  3312ms  commit
   [A] → COMMIT
[A]  3313ms  show statement_timeout
   [A] →
   statement_timeout
   -----------------
   0                
   (1 dòng)
-- set thường, rồi rollback.
[A]  3314ms  begin
   [A] → BEGIN
[A]  3315ms  set statement_timeout = '300ms'
   [A] → SET
[A]  3316ms  rollback
   [A] → ROLLBACK
[A]  3317ms  show statement_timeout
   [A] →
   statement_timeout
   -----------------
   0                
   (1 dòng)
-- set thường, rồi commit.
[A]  3318ms  begin
   [A] → BEGIN
[A]  3319ms  set statement_timeout = '300ms'
   [A] → SET
[A]  3319ms  commit
   [A] → COMMIT
[A]  3320ms  show statement_timeout
   [A] →
   statement_timeout
   -----------------
   300ms            
   (1 dòng)
[A]  3321ms  reset statement_timeout
   [A] → RESET
[A]  3323ms  NOTICE: drop cascades to table exp_to.t
```
