---
id: db-connection-pool
title: Connection pool
parent: db-app
summary: Dùng lại kết nối để giảm chi phí; kích thước pool và dấu hiệu cạn pool.
contentStatus: verified
volatility: slow
verifiedAt: 2026-10-15
verifiedBy: claude
prerequisites:
  - db-drivers
related:
  - be-concurrency-models
  - db-timeouts
  - db-transaction-boundary
sources:
  - id: pg-connections
    url: https://www.postgresql.org/docs/16/runtime-config-connection.html
    title: "PostgreSQL 16 — 20.3. Connections and Authentication"
    supports: "max_connections là số kết nối đồng thời tối đa, mặc định thường là 100, chỉ đặt được khi khởi động máy chủ; reserved_connections (mặc định 0) giữ slot cho role có quyền pg_use_reserved_connections; superuser_reserved_connections (mặc định 3) giữ slot cuối cho superuser."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg-connect
    url: https://www.postgresql.org/docs/16/connect-estab.html
    title: "PostgreSQL 16 — 52.2. How Connections Are Established"
    supports: "Mỗi khi có yêu cầu kết nối, tiến trình postmaster sinh một backend process mới."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: node-pg-pool
    url: https://node-postgres.com/apis/pool
    title: "node-postgres — Pool"
    supports: "max: số client tối đa của pool, mặc định 10; idleTimeoutMillis: client rảnh quá thời gian này bị ngắt và loại khỏi pool, mặc định 10000; connectionTimeoutMillis: thời gian chờ khi kết nối client mới, mặc định 0 tức không giới hạn; client mượn ra phải được release; client rảnh trong pool vẫn có thể phát lỗi và bị tự động loại khỏi pool."
    product: node-postgres
    checkedAt: 2026-10-15
  - id: pg-wiki-connections
    url: https://wiki.postgresql.org/wiki/Number_Of_Database_Connections
    title: "PostgreSQL Wiki — Number Of Database Connections (sửa lần cuối 14/3/2014)"
    supports: "Để thông lượng tốt nhất, số kết nối đang làm việc nên gần ((core_count * 2) + effective_spindle_count); không tính luồng hyperthreading; effective_spindle_count bằng 0 nếu dữ liệu nằm hết trong cache; chưa có phân tích công thức với SSD; coi đây là điểm khởi đầu rồi thử trên hệ thống thật; quá điểm bão hòa thì thông lượng giảm do tranh chấp; đặt max_connections lớn hơn một chút so với số kết nối của pool."
    product: PostgreSQL
    checkedAt: 2026-10-14
  - id: hikari-sizing
    url: https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing
    title: "HikariCP wiki — About Pool Sizing"
    supports: "Nên dùng pool nhỏ, có nhiều luồng chờ kết nối; khi số luồng vượt số nhân CPU (lập luận về máy chủ database), thêm luồng làm chậm hơn (gần đúng, vì luồng chờ I/O nhường nhân); công thức khởi điểm của dự án PostgreSQL; pool-locking khi một luồng cần nhiều kết nối, kích thước tối thiểu Tn x (Cm - 1) + 1, nhưng nên sửa ở tầng ứng dụng trước khi tăng pool."
    product: HikariCP
    checkedAt: 2026-10-15
  - id: pg-protocol
    url: https://www.postgresql.org/docs/16/protocol-flow.html
    title: "PostgreSQL 16 — 55.2. Message Flow (Start-up)"
    supports: "Khi khởi tạo kết nối, máy chủ gửi yêu cầu xác thực và client phải trả lời bằng thông tin xác thực phù hợp, ví dụ mật khẩu."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: pg-pool-src
    url: https://github.com/brianc/node-postgres/blob/pg-pool@3.14.0/packages/pg-pool/index.js
    title: "node-postgres — mã nguồn pg-pool 3.14.0 (index.js)"
    supports: "max mặc định 10; idleTimeoutMillis mặc định 10000; khi pool đầy, connectionTimeoutMillis bằng 0 thì request vào hàng chờ không có timeout, khác 0 thì đặt timeout cho việc chờ một client có sẵn."
    product: pg-pool
    version: "3.14.0"
    checkedAt: 2026-10-15
  - id: pg-monitoring
    url: https://www.postgresql.org/docs/16/monitoring-stats.html
    title: "PostgreSQL 16 — 28.2. The Cumulative Statistics System"
    supports: "Trạng thái idle in transaction: backend đang ở trong transaction nhưng không chạy truy vấn nào."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: pg-functions-info
    url: https://www.postgresql.org/docs/16/functions-info.html
    title: "PostgreSQL 16 — 9.26. System Information Functions and Operators (system_user)"
    supports: "system_user trả về phương thức xác thực và danh tính mà user trình ra khi xác thực, dạng auth_method:identity, hoặc NULL nếu user chưa được xác thực (ví dụ dùng trust)."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
examples:
  - id: lab-pool
    kind: lab-run
    title: "Kết nối mới so với pool, và vượt max_connections trên PostgreSQL 16.15"
    path: lab/experiments/db-connection-pool
    checkedAt: 2026-10-15
changelog:
  - date: 2026-10-14
    note: Claude soạn bản nháp đầu tiên và chạy thử nghiệm trên PostgreSQL 16.15.
  - date: 2026-10-14
    note: "Kiểm chứng: bỏ ví dụ Oracle 2048 → 96 vì chỉ là lời thuật lại không có tải và môi trường; gắn cơ chế pool với node-postgres; dẫn công thức từ PostgreSQL wiki kèm lưu ý; thay con số tự đặt bằng công thức tính slot; chạy lại lab và ghi phương thức xác thực."
  - date: 2026-10-15
    note: "Phản biện vòng 2: chạy lại lab có in phương thức xác thực, dẫn nguồn bước xác thực khi kết nối, ghi phiên bản pg/pg-pool và đối chiếu mã nguồn cho connectionTimeoutMillis, nói rõ lập luận số nhân CPU là của máy chủ database, viết lại lỗi giữ kết nối và câu hỏi 4."
  - date: 2026-10-15
    note: "Phản biện vòng 3: dẫn nguồn định nghĩa system_user để đọc output của lab."
---

## Vấn đề cần giải quyết

Trên PostgreSQL 16, mỗi kết nối mới khiến tiến trình postmaster sinh một backend process riêng[^pg-connect]. Khi khởi tạo kết nối, máy chủ còn gửi yêu cầu xác thực và client phải trả lời, ví dụ bằng mật khẩu[^pg-protocol]. Với truy vấn ngắn, nếu mỗi request mở rồi đóng một kết nối thì phần lớn thời gian rơi vào việc kết nối. Lab đo được điều này với `select 1`.

Database cũng giới hạn số kết nối đồng thời. Trên PostgreSQL 16, `max_connections` mặc định thường là 100 và chỉ đặt được khi khởi động máy chủ[^pg-connections].

## Cơ chế và luồng hoạt động

Connection pool giữ sẵn một số kết nối mở và cho mượn. Lấy `pg.Pool` của node-postgres làm ví dụ, theo bản lab dùng là `pg` 8.16.3 với `pg-pool` 3.14.0; các giá trị mặc định dưới đây đã đối chiếu với mã nguồn bản đó[^node-pg-pool][^pg-pool-src]:

1. Request cần database thì **mượn** một client từ pool. Nếu hết client rảnh và pool chưa đạt `max` (mặc định 10), pool mở thêm; nếu đã đạt thì request **chờ**.
2. Xong việc, request phải **trả** client về pool (`release`) thay vì đóng.
3. Client rảnh quá `idleTimeoutMillis` (mặc định 10 giây) bị ngắt và loại khỏi pool. Client rảnh mà phát lỗi (ví dụ máy chủ ngắt kết nối) cũng tự bị loại.
4. `connectionTimeoutMillis` mặc định là 0, nghĩa là không giới hạn thời gian chờ khi tạo kết nối mới[^node-pg-pool]. Trong mã nguồn `pg-pool` 3.14.0, cùng tham số này cũng giới hạn thời gian chờ một client rảnh khi pool đã đầy; để 0 thì request xếp hàng chờ không giới hạn[^pg-pool-src].

Pool khác (HikariCP cho Java, pool tích hợp trong các framework) có tham số và giá trị mặc định riêng; đọc tài liệu của pool bạn dùng.

**Ứng dụng thực sự có bao nhiêu slot.** PostgreSQL 16 giữ riêng `superuser_reserved_connections` (mặc định 3) slot cho superuser, và `reserved_connections` (mặc định 0) slot cho role có quyền `pg_use_reserved_connections`[^pg-connections]. Role thường của ứng dụng chỉ dùng được `max_connections − superuser_reserved_connections − reserved_connections` slot. Với mặc định, con số này là 97, khớp với lab.

## Điều kiện áp dụng, lợi ích và đánh đổi

Lợi ích: bỏ chi phí mở kết nối ở mỗi request, và giới hạn số kết nối một ứng dụng chiếm.

Đánh đổi nằm ở **kích thước pool**:

- **Pool quá nhỏ:** request chờ kết nối, độ trễ tăng.
- **Pool quá lớn:** wiki HikariCP lập luận về máy chủ database: khi số kết nối đang chạy truy vấn vượt số nhân CPU của máy chủ database, thêm kết nối làm hệ thống chậm hơn chứ không nhanh hơn. Wiki HikariCP lưu ý điều này chỉ gần đúng, vì luồng đang chờ I/O nhường nhân cho việc khác[^hikari-sizing]. Wiki PostgreSQL cũng ghi: quá điểm bão hòa, thông lượng giảm do tranh chấp[^pg-wiki-connections].
- **Điểm khởi đầu cho kích thước.** Wiki PostgreSQL đưa công thức `(core_count * 2) + effective_spindle_count` cho số kết nối đang làm việc[^pg-wiki-connections], kèm các lưu ý:
    - không tính luồng hyperthreading;
    - `effective_spindle_count` bằng 0 khi dữ liệu nằm hết trong cache;
    - trang được sửa lần cuối năm 2014 và ghi rằng chưa có phân tích công thức với SSD;
    - chỉ là điểm khởi đầu, phải thử trên hệ thống thật.
- **Nhiều instance cộng dồn.** Tổng kết nối là tổng `max` của pool ở mọi instance và job. Tổng đó phải nhỏ hơn số slot ở trên. Wiki PostgreSQL khuyên đặt `max_connections` lớn hơn một chút so với tổng kết nối của pool, để còn chỗ cho bảo trì và giám sát[^pg-wiki-connections].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Mở kết nối mới cho mỗi request.** Dấu hiệu: độ trễ cao dù truy vấn đơn giản; database có rất nhiều phiên ngắn.
- **Không trả kết nối** (quên `release`, hoặc nhánh xử lý lỗi bỏ qua bước trả). node-postgres ghi rõ client mượn ra phải được release[^node-pg-pool]. Dấu hiệu: số client đang mượn tăng dần dù tải không tăng, cho tới khi mọi request đều chờ.
- **Một request cần nhiều kết nối cùng lúc.** Khi nhiều luồng cùng giữ một kết nối và chờ kết nối thứ hai, cả pool có thể kẹt (pool-locking). Wiki HikariCP đưa kích thước tối thiểu `Tn x (Cm - 1) + 1` để tránh. Tn là số luồng tối đa, Cm là số kết nối tối đa một luồng giữ cùng lúc. Wiki cũng khuyên sửa ở tầng ứng dụng trước khi tăng pool[^hikari-sizing].
- **Giữ kết nối trong lúc chờ việc khác**, như gọi API ngoài, dù có mở transaction hay không. Kết nối bị chiếm suốt thời gian chờ, nên các request khác phải xếp hàng chờ pool. Dấu hiệu: số client đang mượn chạm `max` trong khi database gần như không chạy truy vấn; nếu đang trong transaction, `pg_stat_activity` hiện các phiên `idle in transaction`, tức đang trong transaction mà không chạy truy vấn nào[^pg-monitoring]. Cách sửa (khuyến nghị của bài): làm việc chậm trước, chỉ mượn client khi sắp chạy truy vấn và trả ngay sau đó.
- **Không đặt timeout khi chờ kết nối.** Với `pg-pool` 3.14.0, `connectionTimeoutMillis` mặc định 0 nên request có thể chờ vô hạn, cả khi database không phản hồi lúc tạo kết nối lẫn khi pool đã đầy[^node-pg-pool][^pg-pool-src].
- **Vượt số slot.** PostgreSQL từ chối kết nối mới với lỗi `53300` (lab). Dấu hiệu: lỗi này xuất hiện khi deploy thêm instance hoặc chạy thêm job.

## Ví dụ thực tế

- [ex:lab-pool] — trên PostgreSQL 16.15, client Node.js v22.22.0 với `pg` 8.16.3, chạy localhost qua TCP, không TLS (`ssl = false`), `system_user` trả về `scram-sha-256:lab_app`, tức phương thức xác thực là scram-sha-256 theo định nghĩa của hàm này[^pg-functions-info]:
    - Mở kết nối + `select 1` + đóng, 200 lần tuần tự: trung bình 9,57 ms. Cùng truy vấn qua `pg.Pool` (max 5): trung bình 0,19 ms. Số tuyệt đối thay đổi giữa các lần chạy; chưa đo qua mạng hay với TLS.
    - Với `max_connections = 100`, `superuser_reserved_connections = 3`, `reserved_connections = 0`, role thường `lab_app` mở được 96 kết nối, cộng 1 kết nối admin là 97. Kết nối tiếp theo bị từ chối với `53300 remaining connection slots are reserved for roles with the SUPERUSER attribute`.

## Câu hỏi tự kiểm tra

- Với PostgreSQL 16, mở một kết nối mới khiến máy chủ làm những gì? Vì sao chi phí đó đáng kể với `select 1` nhưng ít đáng kể hơn với truy vấn chạy vài giây?
- Ứng dụng chạy 6 instance, mỗi instance pool tối đa 20, cộng 2 job nền mỗi job 10 kết nối. PostgreSQL để mặc định. Tính số slot role thường dùng được, và cho biết điều gì xảy ra khi tải cao.
- Vì sao tăng kích thước pool có thể làm hệ thống chậm hơn? Khi nào lập luận này kém chính xác?
- Pool có `max` 10 và `connectionTimeoutMillis` để mặc định. Một handler mượn client, gọi một API ngoài mất 3 giây, rồi mới chạy truy vấn và trả client. Khi có 50 request đồng thời, request thứ 11 trở đi gặp gì, và sửa handler thế nào?

## Chủ đề liên quan và nguồn kiểm chứng
