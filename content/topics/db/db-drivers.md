---
id: db-drivers
title: Driver và client
parent: db-app
summary: "Cách ứng dụng nói chuyện với database: giao thức, driver, kết nối."
contentStatus: draft
volatility: slow
prerequisites:
  - db-database-dbms
related:
  - db-connection-pool
  - db-parameter-binding
  - db-timeouts
  - db-orm
sources:
  - id: pg-protocol-overview
    url: https://www.postgresql.org/docs/16/protocol-overview.html
    title: "PostgreSQL 16 — 55.1. Overview (Frontend/Backend Protocol)"
    supports: "Giao tiếp là một dòng message; byte đầu cho biết loại message, bốn byte sau cho biết độ dài. Pha startup: client mở kết nối và xác thực, phần này do server dẫn dắt; pha thường: client gửi lệnh, server trả kết quả. Simple query: client gửi chuỗi truy vấn dạng text, server phân tích và chạy ngay. Extended query: tách thành parse, bind giá trị tham số và execute. Prepared statement là kết quả phân tích, portal là câu lệnh đã có đủ tham số; cả hai chỉ tồn tại trong một session. Khi server đóng kết nối, transaction còn mở bị rollback."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-11-02
  - id: pg-protocol-flow
    url: https://www.postgresql.org/docs/16/protocol-flow.html
    title: "PostgreSQL 16 — 55.2. Message Flow"
    supports: "Khởi động: StartupMessage có tên user, database và phiên bản giao thức; chu trình xác thực kết thúc bằng AuthenticationOk hoặc ErrorResponse; sau đó ParameterStatus, BackendKeyData (dữ liệu khóa bí mật client phải giữ nếu muốn gửi yêu cầu hủy) và ReadyForQuery. Extended query gồm Parse, Bind, Execute, Sync; một message Parse không được chứa nhiều hơn một câu SQL; lập kế hoạch thường diễn ra khi xử lý Bind; Execute có thể giới hạn số dòng. Một chuỗi nhiều câu lệnh ở simple query chạy như một transaction ngầm."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-11-02
  - id: np-types
    url: https://node-postgres.com/features/types
    title: "node-postgres — Data Types"
    supports: "Kiểu không có type parser được đổi thành string JavaScript. json và jsonb thành object bằng JSON.parse; date, timestamp, timestamptz thành Date; DATE và TIMESTAMP đọc theo giờ địa phương của tiến trình node; Date của JavaScript chỉ chính xác tới mili giây nên micro giây bị cắt; tác giả khuyên dùng TIMESTAMPTZ."
    product: node-postgres
    version: "tài liệu bản hiện hành, lab dùng pg 8.16.3"
    checkedAt: 2026-11-02
  - id: np-pg-types
    url: https://github.com/brianc/node-pg-types
    title: "brianc/node-pg-types — README"
    supports: "node-postgres trả int8 dạng string và để người dùng tự parse, vì JavaScript không hỗ trợ số nguyên 64 bit và số quá lớn sẽ cho kết quả khác với database; hàm count trả int8; setTypeParser đổi cách đọc theo OID của kiểu, ví dụ OID 20 của int8."
    product: pg-types
    version: "README bản hiện hành, lab cài 2.2.0"
    checkedAt: 2026-11-02
  - id: np-queries
    url: https://node-postgres.com/features/queries
    title: "node-postgres — Queries"
    supports: "Với truy vấn có tham số, node-postgres gửi nguyên văn câu truy vấn cùng các tham số tới server, và server thay tham số vào câu lệnh. Đặt name tạo prepared statement: kế hoạch thực thi được cache trên server theo từng kết nối; đa số truy vấn không được lợi nhiều từ prepared statement."
    product: node-postgres
    version: "tài liệu bản hiện hành, lab dùng pg 8.16.3"
    checkedAt: 2026-11-02
  - id: pg-query-source
    url: https://unpkg.com/pg@8.16.3/lib/query.js
    title: "pg 8.16.3 — lib/query.js"
    supports: "requiresPreparation() trả true, tức dùng giao thức extended, khi queryMode là extended, khi câu lệnh có name, có giới hạn rows, hoặc có values khác rỗng."
    product: node-postgres
    version: "pg 8.16.3"
    checkedAt: 2026-11-02
  - id: mdn-max-safe
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
    title: "MDN — Number.MAX_SAFE_INTEGER"
    supports: "Number.MAX_SAFE_INTEGER là 9007199254740991. Định dạng double chỉ biểu diễn an toàn số nguyên từ -(2^53 - 1) tới 2^53 - 1, an toàn nghĩa là biểu diễn chính xác và so sánh đúng; số lớn hơn nên dùng BigInt."
    product: JavaScript
    version: "tài liệu MDN bản hiện hành"
    checkedAt: 2026-11-02
  - id: np-client
    url: https://node-postgres.com/apis/client
    title: "node-postgres — pg.Client"
    supports: "Client.query nhận chuỗi SQL và mảng tham số, hoặc một QueryConfig có text, values, name, rowMode; đặt name tạo prepared statement; rowMode 'array' trả dòng dạng mảng; cấu hình kết nối lấy từ tham số hoặc biến môi trường PGUSER, PGHOST, PGPORT, PGDATABASE."
    product: node-postgres
    version: "tài liệu bản hiện hành, lab dùng pg 8.16.3"
    checkedAt: 2026-11-02
  - id: oracledb-modes
    url: https://node-oracledb.readthedocs.io/en/latest/user_guide/appendix_a.html
    title: "node-oracledb — Appendix A: Node-oracledb Thin and Thick Modes"
    supports: "node-oracledb mặc định chạy Thin mode, không cần thư viện Oracle Client; Thick mode bật khi gọi oracledb.initOracleClient() và dùng Oracle Client. Thin mode không hỗ trợ native network encryption hay checksumming và chỉ hỗ trợ homogeneous pool."
    product: node-oracledb
    version: "tài liệu latest, đọc 02/11/2026, có ghi chú thay đổi tới 26.0.0"
    checkedAt: 2026-11-02
examples:
  - id: lab-drivers
    kind: lab-run
    title: "Hai kết nối, hai dạng giao thức và kiểu dữ liệu qua driver pg 8.16.3 trên PostgreSQL 16.15"
    path: lab/experiments/db-drivers
    checkedAt: 2026-11-02
changelog:
  - date: 2026-11-02
    note: "Claude soạn bài từ tài liệu PostgreSQL 16, node-postgres, node-oracledb và chạy thử nghiệm trên PostgreSQL 16.15 trong Docker."
  - date: 2026-11-02
    note: "Phản biện vòng 1: giới hạn mở bài vào database client/server; dẫn mã nguồn pg cho việc dùng extended query khi có tham số; thêm số đo cộng tiền và count(*) vào lab; sửa cách nói về giới hạn của number, prepared statement; bổ sung điều kiện của nguồn."
---

## Vấn đề cần giải quyết

Với database dạng client/server như PostgreSQL 16, ứng dụng không đọc file dữ liệu. Nó gửi yêu cầu tới tiến trình database qua kết nối mạng, theo giao thức riêng của database đó. Driver là thư viện làm phần việc này thay bạn: mở kết nối, xác thực, gửi câu lệnh và tham số, rồi đổi kết quả sang kiểu dữ liệu của ngôn ngữ.

Phần lớn thời gian bạn không cần nghĩ tới driver. Nhưng nhiều lỗi nằm đúng ở ranh giới này: một số `int8` bị làm tròn, một cột `numeric` đến dưới dạng chuỗi, thời điểm mất phần micro giây, hay một chuỗi nhiều câu lệnh chạy được cho tới khi bạn thêm tham số.

## Cơ chế và luồng hoạt động

**Giao thức là một dòng message.** Trên PostgreSQL 16, mỗi message bắt đầu bằng một byte cho biết loại, rồi bốn byte độ dài; riêng startup message đầu tiên không có byte loại. Một session có hai pha: startup và hoạt động thường[^pg-protocol-overview].

**Mở kết nối.**

1. Client gửi StartupMessage với tên user, tên database và phiên bản giao thức.
2. Server yêu cầu xác thực. Chu trình này kết thúc bằng AuthenticationOk hoặc ErrorResponse.
3. Server gửi các ParameterStatus, rồi BackendKeyData, là dữ liệu client phải giữ nếu muốn gửi yêu cầu hủy về sau, và cuối cùng là ReadyForQuery[^pg-protocol-flow].

Mở kết nối vì vậy tốn nhiều bước hơn một câu lệnh, đó là lý do có connection pool (xem bài Connection pool). Lab cho thấy mỗi kết nối ứng với một backend, tức một tiến trình phía server, riêng: hai kết nối có hai `pg_backend_pid()` khác nhau, và driver `pg` giữ `processID` cùng `secretKey` nhận lúc khởi động.

**Hai cách gửi truy vấn.**

- **Simple query:** client gửi chuỗi SQL, server phân tích và chạy ngay[^pg-protocol-overview]. Một chuỗi có thể chứa nhiều câu lệnh, và chúng chạy như một transaction ngầm, trừ khi chuỗi có lệnh điều khiển transaction tường minh[^pg-protocol-flow].
- **Extended query:** tách thành Parse (phân tích câu lệnh), Bind (gắn giá trị tham số, thường là lúc lập kế hoạch), Execute (chạy, có thể giới hạn số dòng) và Sync. Một message Parse chỉ chứa một câu SQL[^pg-protocol-flow].

Prepared statement là kết quả của bước parse, còn portal là câu lệnh đã đủ tham số. Cả hai chỉ tồn tại trong một session, không dùng chung giữa các session[^pg-protocol-overview]. Vì vậy prepared statement có tên gắn với từng kết nối trong pool, không gắn với ứng dụng.

Trong driver `pg` 8.16.3, câu lệnh có mảng tham số đi qua giao thức extended; mã nguồn `requiresPreparation()` cho thấy điều này[^pg-query-source]. Câu truy vấn và tham số được gửi riêng, server tự thay tham số vào[^np-queries]; bài Bind variable và SQL injection giải thích vì sao nên làm vậy. Lab thấy sự khác biệt rõ nhất ở một lỗi: không có tham số, `select 1 as a; select 2 as b` trả 2 bộ kết quả; có tham số, cùng kiểu chuỗi đó báo `42601: cannot insert multiple commands into a prepared statement`.

**Đổi kiểu dữ liệu.** Với driver `pg`, kiểu nào không có type parser, tức hàm đổi giá trị sang kiểu của JavaScript, sẽ thành string[^np-types]. Kết quả trong lab:

| Kiểu PostgreSQL | Trong JavaScript | Giá trị ví dụ |
|---|---|---|
| `int4`, `float8` | `number` | `1`, `0.1` |
| `int8` | `string` | `"9007199254740993"` |
| `numeric(10,2)` | `string` | `"1.10"` |
| `timestamptz` | `Date` | `2026-01-01T20:04:05.123Z` |
| `jsonb` | object | `{"a":1}` |
| `int[]` | `Array` | `[1,2]` |

`int8` thành string vì `number` của JavaScript không giữ chính xác được mọi số nguyên 64 bit[^np-pg-types]. `number` chỉ an toàn tới `Number.MAX_SAFE_INTEGER`, tức 9007199254740991; số lớn hơn nên dùng `BigInt`[^mdn-max-safe].

**Trên Oracle.** `node-oracledb` (tài liệu đọc ngày 02/11/2026) có hai chế độ. Thin mode là mặc định và không cần thư viện Oracle Client. Thick mode bật bằng `oracledb.initOracleClient()` và dùng thư viện đó. Thin mode có giới hạn riêng, ví dụ không hỗ trợ native network encryption hay checksumming[^oracledb-modes].

## Điều kiện áp dụng, lợi ích và đánh đổi

**Lợi ích của driver.** Bạn không phải tự viết giao thức, và có sẵn cách truyền tham số, đọc kết quả, cấu hình bằng biến môi trường[^np-client].

**Đánh đổi của việc đổi kiểu tự động.**

- Trả `int8` và `numeric` dạng string an toàn cho dữ liệu, đổi lại code phải tự đổi kiểu trước khi tính toán.
- `setTypeParser` đổi được cách đọc theo OID (mã số của kiểu trong PostgreSQL), ví dụ đọc `int8` bằng `parseInt`[^np-pg-types]. Cách này tiện, nhưng áp dụng cho toàn bộ ứng dụng. Bài này khuyên chỉ làm khi chắc giá trị không vượt quá phạm vi số nguyên an toàn.
- Bài này khuyên giữ tiền và các số cần chính xác ở dạng string hoặc kiểu số thập phân của ứng dụng, không đổi sang `number`. Lab: `Number('0.10') + Number('0.20')` cho `0.30000000000000004`, trong khi `numeric` của database cho `0.30`.

**Khi nào prepared statement có tên giúp ích.** Đặt `name` tạo prepared statement, và kế hoạch thực thi được cache theo từng kết nối[^np-queries]. Lợi ích chỉ có khi cùng câu lệnh chạy lại trên cùng kết nối, và tài liệu node-postgres ghi rằng đa số truy vấn không được lợi nhiều[^np-queries]. Bài Bind variable và SQL injection bàn về đánh đổi của kế hoạch dùng chung.

**Khi nào không dùng driver trực tiếp.** Khi ORM đã đáp ứng được truy vấn cần chạy. Bên dưới, ORM vẫn gọi driver (xem bài ORM).

## Lỗi thường gặp và dấu hiệu nhận biết

- **Đổi `int8` sang `Number`.** Dấu hiệu: id lớn bị lệch một vài đơn vị. Lab: `9007199254740993` qua `Number()` thành `9007199254740992`, còn `BigInt()` giữ nguyên.
- **Coi `count(*)` là số.** `count(*)` trả `int8`[^np-pg-types], nên qua driver `pg` nó là string. Dấu hiệu trong lab: `so_dong + 1` ra `"21"` thay vì `3`.
- **Cộng trừ tiền bằng `Number`.** Dấu hiệu trong lab: `0.30000000000000004` thay vì `0.30`, và mất số 0 cuối khi hiển thị (`1.10` thành `1.1`).
- **Lưu thời điểm cần độ chính xác micro giây qua `Date`.** `Date` của JavaScript chỉ tới mili giây[^np-types]. Lab: `.123456` thành `.123`. Dấu hiệu: giá trị đọc lên rồi ghi xuống không còn bằng giá trị cũ.
- **Dùng `timestamp` không có múi giờ.** Driver đọc `DATE` và `TIMESTAMP` theo giờ địa phương của tiến trình Node[^np-types]. Dấu hiệu: cùng dữ liệu nhưng hai máy khác múi giờ cho kết quả khác nhau.
- **Thêm tham số vào chuỗi có nhiều câu lệnh.** Dấu hiệu: lỗi `42601: cannot insert multiple commands into a prepared statement`. Tách thành từng câu, đặt trong một transaction nếu cần.
- **Nghĩ prepared statement dùng chung cho cả pool.** Chúng chỉ tồn tại trong session đã tạo ra[^pg-protocol-overview].

## Ví dụ thực tế

- [ex:lab-drivers] — trên PostgreSQL 16.15, driver `pg` 8.16.3, Node.js v25.2.1:
    - Hai kết nối có hai `pg_backend_pid()` khác nhau; `pg_stat_activity` có hai dòng `client backend`.
    - `select 1 as a; select 2 as b` không tham số trả 2 bộ kết quả; có tham số báo `42601`.
    - `int8` và `numeric` về dưới dạng string; `9007199254740993` qua `Number()` thành `9007199254740992`.
    - `timestamptz` có `.123456` giây, `Date` sau khi qua driver còn `.123`.
    - `Number('0.10') + Number('0.20')` cho `0.30000000000000004`; `0.10::numeric + 0.20::numeric` cho `0.30`.

## Câu hỏi tự kiểm tra

- Liệt kê các bước từ lúc mở kết nối tới lúc gửi được câu lệnh đầu tiên trên PostgreSQL 16. Dữ liệu nào client phải giữ để sau này hủy được một truy vấn?
- Vì sao `select $1::int as a; select 2 as b` lỗi còn `select 1 as a; select 2 as b` thì không? Bạn sửa thế nào nếu cần chạy cả hai câu kèm tham số?
- Một API trả về `id` kiểu `int8` có giá trị vượt `Number.MAX_SAFE_INTEGER`. Dấu hiệu lỗi là gì nếu code đổi nó sang `Number`, và vì sao? Bạn chọn cách nào để an toàn?
- Vì sao một prepared statement đã tạo trên kết nối A không dùng được trên kết nối B trong cùng pool?

## Chủ đề liên quan và nguồn kiểm chứng
