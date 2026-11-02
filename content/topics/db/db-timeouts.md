---
id: db-timeouts
title: Timeout và hủy truy vấn
parent: db-app
summary: Đặt giới hạn thời gian ở các tầng để một truy vấn chậm không làm treo hệ thống.
contentStatus: verified
verifiedAt: 2026-11-02
verifiedBy: claude
volatility: slow
prerequisites:
  - db-connection-pool
related:
  - ops-reliability
  - db-locking
  - db-transaction-boundary
  - db-drivers
sources:
  - id: pg-client-config
    url: https://www.postgresql.org/docs/16/runtime-config-client.html
    title: "PostgreSQL 16 — 20.11. Client Connection Defaults"
    supports: "statement_timeout hủy câu lệnh chạy quá thời gian, mặc định 0 là tắt, không có đơn vị thì tính bằng mili giây; không nên đặt trong postgresql.conf vì ảnh hưởng mọi session. lock_timeout hủy câu lệnh chờ khóa quá thời gian, áp dụng riêng cho từng lần chờ khóa, mặc định 0; nếu statement_timeout khác 0 thì đặt lock_timeout bằng hoặc lớn hơn là vô nghĩa; không nên đặt trong postgresql.conf. idle_in_transaction_session_timeout kết thúc session nghỉ trong transaction đang mở quá thời gian, mặc định 0; session như vậy có thể giữ khóa, và transaction mở ngăn vacuum dọn dead tuple."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-11-02
  - id: pg-protocol-flow
    url: https://www.postgresql.org/docs/16/protocol-flow.html
    title: "PostgreSQL 16 — 55.2. Message Flow"
    supports: "Để hủy, client mở một kết nối mới và gửi CancelRequest thay cho StartupMessage, kèm process ID và secret key nhận lúc khởi động; server không trả lời trực tiếp; yêu cầu hủy có thể có hoặc không có tác dụng, và client không biết trực tiếp là hủy thành công hay chưa, phải tiếp tục chờ server trả lời cho câu lệnh."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-11-02
  - id: pg-set
    url: https://www.postgresql.org/docs/16/sql-set.html
    title: "PostgreSQL 16 — SET"
    supports: "SET trong transaction bị hủy thì mất tác dụng khi rollback; sau khi transaction commit, tác dụng kéo dài tới hết session, trừ khi có SET khác ghi đè. SET LOCAL chỉ có tác dụng tới hết transaction hiện tại, dù commit hay không; sau COMMIT hoặc ROLLBACK, giá trị cấp session có hiệu lực trở lại."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-11-02
  - id: pg-signal
    url: https://www.postgresql.org/docs/16/functions-admin.html
    title: "PostgreSQL 16 — 9.27. System Administration Functions"
    supports: "pg_cancel_backend hủy truy vấn hiện tại của session có process ID đã cho; pg_terminate_backend kết thúc session đó. Mặc định chỉ superuser dùng được, nhưng có thể GRANT; role là thành viên của role sở hữu backend hoặc có đặc quyền pg_signal_backend cũng dùng được, trừ với backend của superuser."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-11-02
  - id: np-client
    url: https://node-postgres.com/apis/client
    title: "node-postgres — pg.Client"
    supports: "Cấu hình của Client: statement_timeout (mili giây trước khi một câu lệnh hết giờ), query_timeout (mili giây trước khi lời gọi query hết giờ), lock_timeout, connectionTimeoutMillis (mili giây chờ kết nối), idle_in_transaction_session_timeout; mặc định không có timeout."
    product: node-postgres
    version: "tài liệu bản hiện hành, lab dùng pg 8.16.3"
    checkedAt: 2026-11-02
  - id: np-pool
    url: https://node-postgres.com/apis/pool
    title: "node-postgres — pg.Pool"
    supports: "connectionTimeoutMillis mặc định 0 là không giới hạn; khi hết client, yêu cầu chờ trong hàng FIFO và có thể treo vô hạn nếu giá trị này là 0, đặt giá trị khác thì lời gọi lỗi sau thời gian đó."
    product: node-postgres
    version: "tài liệu bản hiện hành, lab dùng pg 8.16.3"
    checkedAt: 2026-11-02
  - id: pg17-client-config
    url: https://www.postgresql.org/docs/17/runtime-config-client.html
    title: "PostgreSQL 17 — 19.11. Client Connection Defaults"
    supports: "transaction_timeout kết thúc session ở trong một transaction lâu hơn thời gian đặt, áp dụng cho cả transaction tường minh và transaction ngầm của một câu lệnh; mặc định 0 là tắt."
    product: PostgreSQL
    version: "17"
    checkedAt: 2026-11-02
  - id: aws-timeouts
    url: https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter
    title: "Amazon Builders' Library — Timeouts, retries, and backoff with jitter"
    supports: "Khi nhiều request giữ tài nguyên lâu, server có thể cạn tài nguyên như bộ nhớ, thread, kết nối, cổng. Để chọn timeout, Amazon chọn một tỷ lệ timeout nhầm chấp nhận được (ví dụ 0,1%) rồi xem percentile độ trễ tương ứng của dịch vụ phía dưới (p99.9). Timeout đặt quá cao thì mất giá trị, vì tài nguyên vẫn bị giữ trong lúc client chờ. Cách chọn này dành cho lời gọi trong một AWS Region, và không dùng được khi client có độ trễ mạng lớn hoặc khi p99.9 gần p50."
    product: Amazon Builders' Library
    version: "đăng 05/12/2019"
    checkedAt: 2026-11-02
examples:
  - id: lab-timeouts
    kind: lab-run
    title: "statement_timeout, lock_timeout, idle_in_transaction_session_timeout và query_timeout của driver trên PostgreSQL 16.15"
    path: lab/experiments/db-timeouts
    checkedAt: 2026-11-02
changelog:
  - date: 2026-11-02
    note: "Claude soạn bài từ tài liệu PostgreSQL 16, node-postgres, Amazon Builders' Library và chạy thử nghiệm trên PostgreSQL 16.15 trong Docker."
  - date: 2026-11-02
    note: "Phản biện vòng 1: bỏ ý sai về pg_dump (pg_dump tự đặt statement_timeout = 0), ghi dấu hiệu migration là suy luận; thêm vào lab connectionTimeoutMillis, client mượn bị kết thúc, set local sau rollback; sửa phần xử lý lỗi với pool; nêu giới hạn của cách chọn timeout; thêm PostgreSQL 17; ghi khuyến nghị là của bài."
  - date: 2026-11-02
    note: "Phản biện vòng 2: thêm nguồn SET và lab bước 9 so set local với set sau commit; ghi pg-pool và Node.js; bước 7 chạy thêm một câu trên client đang giữ."
  - date: 2026-11-02
    note: "Phản biện vòng 3: không còn blocker hay major; minor để lại cho nhóm tồn chặng 5 (ghi ở docs/reviews/chang-04.md); kiểm chứng."
---

## Vấn đề cần giải quyết

Mặc định, PostgreSQL 16 không giới hạn thời gian cho câu lệnh, cho việc chờ khóa, hay cho transaction đang nghỉ: cả ba tham số đều bằng 0[^pg-client-config]. Driver `pg` cũng không có timeout mặc định[^np-client].

Vì vậy một câu lệnh chậm có thể giữ một kết nối của pool rất lâu. Thêm vài câu như thế, pool hết kết nối, và các request khác chờ theo, kể cả request không liên quan. Một bài trong Amazon Builders' Library gọi đây là việc cạn tài nguyên: nhiều request giữ tài nguyên lâu thì server hết bộ nhớ, thread hay kết nối[^aws-timeouts].

Timeout là cách nói trước: chờ tới đây thì thôi, trả lỗi để phần còn lại của hệ thống chạy tiếp.

## Cơ chế và luồng hoạt động

Các loại timeout dừng những thứ khác nhau, ở những chỗ khác nhau:

| Timeout | Nằm ở đâu | Dừng cái gì | Lỗi trong lab | Sau đó |
|---|---|---|---|---|
| `statement_timeout` | server | câu lệnh chạy quá lâu | `57014` | kết nối dùng tiếp được; nếu trong transaction thì transaction hỏng |
| `lock_timeout` | server | câu lệnh chờ khóa quá lâu | `55P03` | như trên |
| `idle_in_transaction_session_timeout` | server | session nghỉ trong transaction đang mở | `25P03` | session bị kết thúc, transaction mất |
| `query_timeout` | driver `pg` | lời gọi `query` ở phía client | `Query read timeout` | server có thể vẫn chạy |
| `connectionTimeoutMillis` của pool | driver `pg` | việc chờ lấy kết nối | `timeout exceeded when trying to connect` | client đang giữ không bị ảnh hưởng |

**`statement_timeout`.** Hủy mọi câu lệnh chạy quá thời gian đặt[^pg-client-config]. Lab đặt `300ms` rồi chạy `pg_sleep(2)`: câu lệnh bị hủy sau khoảng 300 ms với `57014: canceling statement due to statement timeout`, và câu `select` tiếp theo trên cùng kết nối vẫn chạy.

Nếu đang ở trong transaction, câu lệnh bị hủy làm hỏng cả transaction. Lab: câu tiếp theo báo `25P02`, và sau `rollback`, dữ liệu trở về như cũ. `set local` chỉ có tác dụng tới hết transaction hiện tại, dù commit hay không; `set` thường trong transaction thì mất khi `rollback`, nhưng sau `commit` giữ tới hết session[^pg-set]. Lab bước 9: sau `commit`, `show statement_timeout` trả `0` với `set local`, và `300ms` với `set` thường.

**`lock_timeout`.** Chỉ tính thời gian chờ khóa, và tính riêng cho từng lần chờ[^pg-client-config]. Nó hữu ích khi câu lệnh chạy nhanh nhưng có thể bị chặn lâu, như `ALTER TABLE` (xem bài Locking). Nếu `statement_timeout` khác 0, đặt `lock_timeout` bằng hoặc lớn hơn là vô nghĩa, vì `statement_timeout` luôn tới trước[^pg-client-config].

**`idle_in_transaction_session_timeout`.** Kết thúc session nghỉ trong transaction đang mở. Lý do: session như vậy có thể giữ khóa, và transaction mở ngăn vacuum dọn dead tuple, tức các phiên bản dòng đã cũ (xem bài MVCC)[^pg-client-config]. Khác hai tham số trên, cái này kết thúc cả session. Trong lab, đặt 300 ms rồi nghỉ 800 ms, phiên đã nhận `25P03: terminating connection due to idle-in-transaction timeout`, `update` chưa commit không còn, và `pg_stat_activity` không còn phiên đó.

**Đặt timeout từ driver.** Với `pg` 8.16.3, tùy chọn `statement_timeout` của `Client` khác với `query_timeout`[^np-client]:

- `statement_timeout` được gửi tới server: lab thấy `show statement_timeout` trả `300ms`, và chính server hủy câu lệnh.
- `query_timeout` là bộ đếm ở phía client. Lab: client báo `Query read timeout` sau khoảng 300 ms, trong khi `pg_stat_activity` vẫn cho thấy phiên đó `active` với `select pg_sleep(3)`.

Đây là điểm dễ nhầm nhất: **client bỏ cuộc không có nghĩa là server dừng.**

**Hủy một truy vấn đang chạy.** Có hai cách:

- `pg_cancel_backend(pid)` hủy truy vấn hiện tại của session đó; `pg_terminate_backend(pid)` kết thúc cả session[^pg-signal]. Lab: sau `pg_cancel_backend`, phiên từ `active` về `idle`.
- Ở mức giao thức, client mở một kết nối mới và gửi CancelRequest kèm process ID và secret key. Server không trả lời trực tiếp, và yêu cầu có thể không có tác dụng[^pg-protocol-flow].

## Điều kiện áp dụng, lợi ích và đánh đổi

**Lợi ích.** Một câu lệnh chậm chỉ làm hỏng một request, không kéo theo cả pool.

**Chọn giá trị thế nào.** Với lời gọi trong một AWS Region, Amazon chọn một tỷ lệ timeout nhầm chấp nhận được (ví dụ 0,1%), rồi lấy percentile độ trễ tương ứng của dịch vụ phía dưới; p99.9 là mức mà 99,9% lời gọi nhanh hơn. Cách này không dùng được khi client có độ trễ mạng lớn, hoặc khi p99.9 gần p50[^aws-timeouts]. Bài này suy ra cho database: đo độ trễ thật của truy vấn trước khi đặt số, không đoán.

**Đánh đổi.**

- **Quá thấp:** câu lệnh bình thường bị hủy nhầm. Với thao tác cần chạy lâu như migration hay báo cáo, đặt riêng cho phiên đó.
- **Quá cao:** tài nguyên vẫn bị giữ trong lúc chờ, nên timeout mất giá trị[^aws-timeouts].
- **Đặt ở đâu:** tài liệu PostgreSQL 16 không khuyên đặt `statement_timeout` và `lock_timeout` trong `postgresql.conf`, vì sẽ ảnh hưởng mọi session[^pg-client-config]. Bài này đề xuất đặt theo role, theo kết nối của ứng dụng, hoặc `set local` trong từng transaction.
- **Giữa các tầng** (khuyến nghị của bài): để timeout phía server ngắn hơn timeout phía client và của API, để server tự dừng câu lệnh trước khi client bỏ cuộc. Nếu làm ngược lại, câu lệnh tiếp tục chạy sau khi không còn ai chờ kết quả, như lab bước 6.

**Không đủ:** PostgreSQL 16 không có tham số giới hạn cả transaction[^pg-client-config], nên một transaction gồm nhiều câu ngắn liên tiếp vẫn có thể kéo dài. PostgreSQL 17 có `transaction_timeout`[^pg17-client-config]. Với PostgreSQL 16, cần giữ transaction ngắn ở tầng ứng dụng (xem bài Transaction boundary trong ứng dụng).

## Lỗi thường gặp và dấu hiệu nhận biết

- **Không đặt timeout nào.** Dấu hiệu: một truy vấn chậm kéo theo hàng loạt request chờ; `pg_stat_activity` có phiên `active` chạy rất lâu.
- **Chỉ đặt `query_timeout` ở client.** Dấu hiệu: API trả lỗi timeout, nhưng `pg_stat_activity` vẫn còn câu lệnh `active`, và database vẫn bận. Thêm `statement_timeout` để server tự dừng.
- **Đặt `statement_timeout` trong `postgresql.conf` cho mọi session.** Tài liệu không khuyên làm vậy, vì nó ảnh hưởng mọi session[^pg-client-config]. Bài này suy ra dấu hiệu: migration hay báo cáo chạy lâu bị hủy với `57014`.
- **Không xử lý lỗi `57014` trong transaction.** Dấu hiệu: câu sau báo `25P02: current transaction is aborted`. Code phải rollback rồi mới dùng lại kết nối.
- **Dùng tiếp client sau khi session bị kết thúc.** Dấu hiệu trong lab: sự kiện `error` với `25P03` rồi `Connection terminated unexpectedly`, và câu tiếp theo báo `Client has encountered a connection error and is not queryable`. Với client đang được mượn từ pool, lỗi không đi qua `pool.on('error')`: lab bước 8, với `pg-pool` 3.14.0, cho thấy nếu không gắn `client.on('error')` trong lúc giữ client, tiến trình Node nhận `uncaughtException`.
- **Không có timeout khi chờ kết nối.** `connectionTimeoutMillis` của pool mặc định 0, nên lời gọi có thể treo vô hạn khi pool hết client[^np-pool]. Dấu hiệu: request treo ở bước lấy kết nối, trong khi số client đang mượn đã chạm `max`.

## Ví dụ thực tế

- [ex:lab-timeouts] — trên PostgreSQL 16.15, Node.js v24.22.2, driver `pg` 8.16.3, `pg-pool` 3.14.0:
    - `statement_timeout = 300ms`, `pg_sleep(2)`: lỗi `57014` sau khoảng 300 ms; kết nối vẫn chạy được câu tiếp theo.
    - Trong transaction: sau `57014`, câu tiếp theo báo `25P02`; sau `rollback`, cột `v` vẫn là 0.
    - `lock_timeout = 300ms` khi dòng đang bị khóa: lỗi `55P03: canceling statement due to lock timeout`.
    - `idle_in_transaction_session_timeout = 300ms`: lỗi `25P03`, `v` vẫn là 0, `pg_stat_activity` có 0 phiên `lab-C`.
    - `query_timeout: 300`: client nhận `Query read timeout`; `pg_stat_activity` vẫn ghi `active` với `select pg_sleep(3)`; sau `pg_cancel_backend` thì `idle`.
    - Pool `max: 1`, `connectionTimeoutMillis: 300`: lần lấy thứ hai lỗi `timeout exceeded when trying to connect`.
    - Client đang mượn bị kết thúc vì nghỉ trong transaction: `pool.on('error')` không chạy, tiến trình nhận `uncaughtException` với `25P03`.
    - `set local statement_timeout = '300ms'` rồi `commit`: `show statement_timeout` trả `0`; `set` thường rồi `commit`: trả `300ms`.

## Câu hỏi tự kiểm tra

- `statement_timeout`, `lock_timeout` và `idle_in_transaction_session_timeout` khác nhau thế nào về thứ bị dừng và trạng thái kết nối sau đó?
- API của bạn trả lỗi timeout sau 3 giây, nhưng database vẫn bận. Bạn kiểm tra gì, và đặt timeout ở đâu để câu lệnh dừng thật?
- Trong một transaction, một câu lệnh bị `statement_timeout` hủy. Câu lệnh tiếp theo báo gì, và code phải làm gì?
- Bạn đặt `statement_timeout = 2s` và `lock_timeout = 5s`. Tham số nào có tác dụng khi câu lệnh bị chặn bởi khóa, và vì sao?
- Làm sao chọn giá trị `statement_timeout` dựa trên số đo thay vì đoán? Khi nào cần đặt khác cho một phiên riêng?

## Chủ đề liên quan và nguồn kiểm chứng
