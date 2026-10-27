---
id: db-transaction-boundary
title: Transaction boundary trong ứng dụng
parent: db-app
summary: Đặt ranh giới transaction ở đâu trong code và lỗi khi đặt sai.
contentStatus: verified
volatility: slow
verifiedAt: 2026-10-15
verifiedBy: claude
prerequisites:
  - db-transaction-acid
  - db-connection-pool
related:
  - db-orm
  - db-isolation-levels
  - db-locking
  - be-background-jobs
sources:
  - id: pg-iso
    url: https://www.postgresql.org/docs/16/transaction-iso.html
    title: "PostgreSQL 16 — 13.2. Transaction Isolation"
    supports: "Ở Read Committed, mỗi câu SELECT thấy snapshot lúc nó bắt đầu, hai câu SELECT liên tiếp trong cùng transaction có thể thấy dữ liệu khác nhau; UPDATE gặp dòng đang bị transaction khác sửa thì chờ, nếu transaction kia commit thì đánh giá lại WHERE trên phiên bản mới; không phù hợp với điều kiện tìm kiếm phức tạp; ứng dụng dùng Serializable phải sẵn sàng chạy lại transaction."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg-client-config
    url: https://www.postgresql.org/docs/16/runtime-config-client.html
    title: "PostgreSQL 16 — 20.11. Client Connection Defaults"
    supports: "idle_in_transaction_session_timeout giúp phiên nghỉ trong transaction không giữ khóa quá lâu; transaction đang mở ngăn VACUUM dọn các dòng vừa chết."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg-monitoring
    url: https://www.postgresql.org/docs/16/monitoring-stats.html
    title: "PostgreSQL 16 — 28.2. The Cumulative Statistics System"
    supports: "idle in transaction: backend đang ở trong transaction nhưng không chạy truy vấn; wait event transactionid: chờ một transaction kết thúc."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: spring-tx
    url: https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html
    title: "Spring Framework 7.0.9 Reference — Using @Transactional"
    supports: "Ở proxy mode (mặc định) chỉ lời gọi từ bên ngoài đi qua proxy mới được bọc; method gọi method khác trong cùng object không tạo transaction dù có @Transactional; cân nhắc AspectJ mode nếu cần bọc cả lời gọi nội bộ; mặc định RuntimeException và Error gây rollback, checked exception thì không; từ 6.2 đổi mặc định toàn cục bằng @EnableTransactionManagement(rollbackOn=ALL_EXCEPTIONS)."
    product: Spring Framework
    version: "7.0.9"
    checkedAt: 2026-10-14
  - id: spring-tx-events
    url: https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html
    title: "Spring Framework 7.0.9 Reference — Transaction-bound Events"
    supports: "@TransactionalEventListener gắn listener vào một pha của transaction, mặc định AFTER_COMMIT; nếu không có transaction đang chạy thì listener không được gọi, trừ khi đặt fallbackExecution = true."
    product: Spring Framework
    version: "7.0.9"
    checkedAt: 2026-10-14
  - id: acidrain
    url: https://www.bailis.org/papers/acidrain-sigmod2017.pdf
    title: "Warszawski & Bailis — ACIDRain (SIGMOD 2017)"
    supports: "22 tấn công ở 12 ứng dụng thương mại điện tử tự host; 17 thuộc loại scope-based (thao tác không được bao trong transaction đúng phạm vi), xảy ra bất kể mức isolation; 5 thuộc loại level-based; thử nghiệm trên MySQL 5.5.53 và MariaDB 10.1.10."
    checkedAt: 2026-10-14
  - id: pg-locking
    url: https://www.postgresql.org/docs/16/explicit-locking.html
    title: "PostgreSQL 16 — 13.3. Explicit Locking"
    supports: "FOR UPDATE khóa các dòng mà SELECT lấy ra như thể để cập nhật, ngăn transaction khác khóa, sửa hoặc xóa chúng cho tới khi transaction hiện tại kết thúc."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: pg-applevel
    url: https://www.postgresql.org/docs/16/applevel-consistency.html
    title: "PostgreSQL 16 — 13.4. Data Consistency Checks at the Application Level"
    supports: "Dùng Serializable cho mọi lần ghi và mọi lần đọc cần nhất quán thì không cần thêm gì để giữ nhất quán; khi có ghi không serializable, phải dùng SELECT FOR UPDATE, SELECT FOR SHARE hoặc LOCK TABLE; SELECT FOR UPDATE/FOR SHARE chỉ khóa các dòng trả về, LOCK TABLE khóa cả bảng."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: spring-aop-proxies
    url: https://docs.spring.io/spring-framework/reference/core/aop/proxying.html
    title: "Spring Framework 7.0.9 — Proxying Mechanisms (Understanding AOP Proxies)"
    supports: "Lời gọi qua tham chiếu this không đi qua proxy nên advice không chạy; cách tốt nhất là tổ chức lại code để không tự gọi; có thể tự inject chính bean và gọi qua tham chiếu đó; AopContext.currentProxy() rất không được khuyến khích; AspectJ weaving không gặp vấn đề tự gọi vì không dùng proxy."
    product: Spring Framework
    version: "7.0.9"
    checkedAt: 2026-10-15
  - id: modulith-events
    url: https://docs.spring.io/spring-modulith/reference/events.html
    title: "Spring Modulith 2.1.1 — Working with Application Events"
    supports: "Listener chạy sau commit lỗi thì sự kiện bị mất trừ khi listener tự có cơ chế an toàn, và hệ thống có thể dừng trước khi listener được gọi; listener chạy trong transaction làm ranh giới rộng ra và lỗi của chức năng không thiết yếu có thể làm cả transaction thất bại; event publication registry ghi một bản ghi cho mỗi transactional listener vào event publication log trong transaction nghiệp vụ ban đầu."
    product: Spring Modulith
    version: "2.1.1"
    checkedAt: 2026-10-15
examples:
  - id: lab-boundary
    kind: lab-run
    title: "Hai quản lý cùng quyết định một yêu cầu trên PostgreSQL 16.15: năm cách viết"
    path: lab/experiments/db-transaction-boundary
    checkedAt: 2026-10-15
  - id: acidrain-case
    kind: research
    title: "ACIDRain (2017): 17 trên 22 lỗ hổng do thao tác không nằm trong transaction đúng phạm vi"
    url: https://www.bailis.org/papers/acidrain-sigmod2017.pdf
    checkedAt: 2026-10-14
  - id: spring-self-invocation
    kind: official-doc
    title: "Spring 7.0.9: @Transactional không có tác dụng khi method tự gọi nhau trong cùng object"
    url: https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html
    checkedAt: 2026-10-14
changelog:
  - date: 2026-10-14
    note: Claude soạn bản nháp đầu tiên và chạy thử nghiệm trên PostgreSQL 16.15.
  - date: 2026-10-14
    note: "Kiểm chứng: thêm bước lab cho thấy đọc rồi update không điều kiện trong cùng transaction Read Committed vẫn mất cập nhật; ghi rõ quy ước tầng service là cách tổ chức có điều kiện; thêm nguồn cho idle in transaction, gửi sau commit và cách sửa của Spring; sửa số liệu ACIDRain; ghi phiên bản trong thân bài."
  - date: 2026-10-15
    note: "Phản biện vòng 2: thêm bước SELECT ... FOR UPDATE vào lab, dẫn nguồn cách sửa tự gọi trong Spring và đánh đổi của listener sau commit (Spring Modulith), thay ví dụ tự đặt bằng hướng dẫn của PostgreSQL và lab của bài Isolation level, bỏ các nhận định tần suất không có nguồn."
  - date: 2026-10-15
    note: "Phản biện vòng 3: tách hai trường hợp quy tắc trên dòng đã có và quy tắc bị phá bởi dòng mới chèn, ghi rõ là suy luận của bài; gắn bước 1 với loại scope-based và bước 4 với loại level-based của ACIDRain."
---

## Vấn đề cần giải quyết

Biết transaction là gì chưa đủ; câu hỏi khó là **mở và đóng nó ở đâu trong code**.

- **Đặt quá hẹp** (mỗi câu lệnh một transaction): thao tác nghiệp vụ nhiều bước không còn atomic.
- **Đặt quá rộng** (bao cả lời gọi API ngoài): giữ khóa và kết nối quá lâu. Trên PostgreSQL 16, phiên nghỉ trong một transaction đang mở có thể giữ khóa và ngăn VACUUM dọn dữ liệu cũ[^pg-client-config].

Lỗi mà lab tái hiện là "đọc, kiểm tra ở ứng dụng, rồi ghi", trong khi giữa bước đọc và bước ghi, transaction khác đã đổi dữ liệu. Ở lab bước 1, mỗi lệnh tự commit: đây là loại mà nghiên cứu ACIDRain gọi là scope-based, bất thường do thiếu bao bọc bằng transaction, chiếm 17 trên 22 lỗ hổng họ xác minh[^acidrain]. Bọc cả hai bước vào một transaction vẫn **chưa đủ** ở Read Committed (lab bước 4). Lỗi này thuộc loại level-based, phát sinh do database chạy ở mức isolation không serializable, chiếm 5 trên 22[^acidrain].

## Cơ chế và luồng hoạt động

**Vì sao một transaction chưa đủ.** Ở Read Committed trên PostgreSQL 16, mỗi câu `SELECT` thấy snapshot lúc câu đó bắt đầu, và hai câu `SELECT` liên tiếp trong cùng transaction có thể thấy dữ liệu khác nhau[^pg-iso]. Giá trị ứng dụng đọc được có thể đã cũ khi nó ghi. Nếu câu ghi không kiểm tra lại điều kiện, nó ghi đè lên thay đổi của người khác.

Hai cách làm "kiểm tra rồi ghi" an toàn khi có người ghi đồng thời:

1. **Đưa điều kiện vào câu lệnh ghi.** `UPDATE requests SET status = 'approved' WHERE id = $1 AND status = 'pending'`, rồi kiểm tra số dòng bị ảnh hưởng. Ở Read Committed trên PostgreSQL 16, nếu dòng đang bị transaction khác sửa, câu lệnh chờ. Khi transaction kia commit, điều kiện `WHERE` được đánh giá lại trên phiên bản mới; không còn khớp thì dòng bị bỏ qua[^pg-iso].
2. **Khóa trước rồi kiểm tra.** `SELECT ... FOR UPDATE` dòng cần đổi, kiểm tra trong ứng dụng, rồi ghi, tất cả trong một transaction (xem bài Locking).

**Ranh giới trong code.** Một cách tổ chức là cho ranh giới trùng với một thao tác nghiệp vụ ở tầng service. Ví dụ "duyệt yêu cầu" gồm kiểm tra trạng thái, đổi trạng thái, ghi lịch sử. Đây là quy ước tổ chức code, không phải yêu cầu của database. Nó hợp khi một thao tác nghiệp vụ gọi nhiều repository, và controller chỉ gọi một thao tác.

**Framework khai báo transaction bằng annotation** tạo ranh giới qua proxy. Trong Spring Framework 7.0.9 ở proxy mode (mặc định), chỉ lời gọi từ bên ngoài đi qua proxy mới được bọc. Một method gọi method khác trong cùng object không tạo transaction thật, dù method đó có `@Transactional`. Cần bọc cả lời gọi nội bộ thì cân nhắc AspectJ mode[^spring-tx].

Mặc định Spring rollback khi gặp `RuntimeException` hoặc `Error`, còn checked exception thì không. Từ bản 6.2 có thể đổi mặc định toàn cục bằng `@EnableTransactionManagement(rollbackOn=ALL_EXCEPTIONS)`[^spring-tx].

## Điều kiện áp dụng, lợi ích và đánh đổi

- **Cách 1** hợp với điều kiện chỉ nằm trên chính dòng đang sửa. Tài liệu PostgreSQL 16 lưu ý cách đánh giá lại này không phù hợp với điều kiện tìm kiếm phức tạp[^pg-iso].
- **Cách 2** hợp khi phải đọc nhiều thứ rồi mới quyết định.
- Cả hai cách đều giữ khóa dòng tới khi commit, và người đến sau đều phải chờ: lab bước 3 cho cách 1, bước 5 cho cách 2. `FOR UPDATE` ngăn transaction khác khóa, sửa hoặc xóa các dòng đã đọc cho tới khi transaction hiện tại kết thúc[^pg-locking]. Khác nhau ở thời điểm lấy khóa: cách 1 lấy lúc ghi, cách 2 lấy ngay lúc đọc, nên giữ lâu hơn.
- Tài liệu PostgreSQL 16 đưa ra hai hướng để giữ quy tắc nghiệp vụ: dùng Serializable cho mọi lần ghi và mọi lần đọc cần nhất quán, hoặc khóa tường minh bằng `SELECT FOR UPDATE`, `SELECT FOR SHARE` hay `LOCK TABLE`. `SELECT FOR UPDATE` và `SELECT FOR SHARE` chỉ khóa các dòng trả về, còn `LOCK TABLE` khóa cả bảng[^pg-applevel]. Từ đó bài này chia hai trường hợp (đây là suy luận của bài):
    - Quy tắc chỉ đọc các dòng đã có: khóa mọi dòng mà quy tắc đọc bằng `FOR UPDATE` hoặc `FOR SHARE`.
    - Quy tắc có thể bị phá bởi một dòng mới được chèn: dòng đó chưa tồn tại nên khóa dòng không bảo vệ được; dùng Serializable kèm retry, hoặc `LOCK TABLE` trên các bảng mà phép kiểm tra cần[^pg-applevel].

    Ứng dụng dùng Serializable phải sẵn sàng chạy lại transaction[^pg-iso]. Bài Isolation level có lab chạy kịch bản "phòng ban phải còn ít nhất một người duyệt" ở Repeatable Read và Serializable.

**Việc phụ như gửi email** nên chạy sau khi commit thành công. Spring 7.0.9 có `@TransactionalEventListener`, mặc định chạy ở pha `AFTER_COMMIT`. Nếu không có transaction nào đang chạy, listener không được gọi, trừ khi đặt `fallbackExecution = true`[^spring-tx-events]. Đánh đổi theo tài liệu Spring Modulith 2.1.1: nếu listener chạy sau commit bị lỗi vì bất kỳ lý do gì, sự kiện bị mất, trừ khi listener tự có cơ chế an toàn; hệ thống thậm chí có thể dừng trước khi listener được gọi[^modulith-events]. Ngược lại, chạy việc phụ ngay trong transaction làm ranh giới transaction rộng ra, và một chức năng không thiết yếu bị lỗi có thể làm cả transaction thất bại[^modulith-events]. Cách Spring Modulith giải quyết: event publication registry ghi một bản ghi cho mỗi listener vào event publication log, ngay trong transaction nghiệp vụ ban đầu[^modulith-events] (xem bài Background job).

## Lỗi thường gặp và dấu hiệu nhận biết

- **Đọc bằng `SELECT` thường rồi `UPDATE` không điều kiện**, dù ở hai transaction hay trong cùng một transaction Read Committed. Dấu hiệu: một yêu cầu có hai quyết định trái ngược trong lịch sử, và trạng thái cuối phụ thuộc ai bấm sau (lab bước 1 và 4).
- **Không kiểm tra số dòng bị ảnh hưởng.** Câu `UPDATE ... WHERE status = 'pending'` không đổi dòng nào nhưng ứng dụng vẫn báo thành công.
- **Gọi method `@Transactional` từ chính class đó** (Spring, proxy mode). Tài liệu ghi rằng lời gọi này không tạo transaction thật[^spring-tx]. Biểu hiện cụ thể phụ thuộc cách truy cập dữ liệu. Tài liệu Spring Framework 7.0.9 về AOP proxy nêu các cách sửa: tốt nhất là tổ chức lại code để không còn tự gọi; hoặc tự inject chính bean đó và gọi qua tham chiếu này thay vì `this`; còn AspectJ weaving thì không gặp vấn đề vì không dùng proxy[^spring-aop-proxies]. Tài liệu không khuyến khích dùng `AopContext.currentProxy()`[^spring-aop-proxies].
- **Ném checked exception và mong rollback.** Mặc định Spring không rollback với checked exception[^spring-tx]. Dấu hiệu: lỗi xảy ra nhưng thay đổi trước đó vẫn được commit.
- **Bao cả lời gọi API ngoài trong transaction.** Dấu hiệu: `pg_stat_activity` có phiên `idle in transaction` lâu, tức đang trong transaction mà không chạy truy vấn[^pg-monitoring]; chờ khóa tăng khi dịch vụ ngoài chậm.

## Ví dụ thực tế

- [ex:lab-boundary] — trên PostgreSQL 16.15, Read Committed, hai quản lý cùng quyết định yêu cầu 1:
    1. Đọc, kiểm tra ở ứng dụng rồi ghi, mỗi lệnh tự commit: cả hai thấy `pending` và đều ghi. Lịch sử có `approved` (người 10) và `rejected` (người 11); trạng thái cuối `rejected`. Bước này là thứ tự xen kẽ do script sắp đặt.
    2. Update có điều kiện `AND status = 'pending'` trong transaction: lần thứ hai đổi 0 dòng và rollback; lịch sử chỉ có một quyết định.
    3. Hai update có điều kiện chạy đồng thời: B chờ transaction A kết thúc (`wait_event_type = Lock`, `wait_event = transactionid`, tức chờ một transaction kết thúc[^pg-monitoring]). Sau khi A commit, câu update của B đổi 0 dòng.
    4. Đọc rồi update không điều kiện, cả hai bước trong cùng một transaction: B chờ A commit rồi vẫn `UPDATE 1`. Trạng thái cuối `rejected`, lịch sử có hai quyết định.
    5. Khóa dòng ngay lúc đọc bằng `SELECT ... FOR UPDATE` rồi kiểm tra ở ứng dụng: B chờ ngay ở câu đọc; sau khi A commit, B đọc thấy `approved`, rollback và không ghi. Lịch sử chỉ có một quyết định.
- [ex:acidrain-case] — ACIDRain (SIGMOD 2017) xác minh 22 tấn công ở 12 ứng dụng thương mại điện tử tự host[^acidrain].
    - 17 lỗ hổng là loại scope-based: thao tác không được bao trong transaction đúng phạm vi. Loại này xảy ra bất kể mức isolation.
    - Chỉ 5 lỗ hổng do mức isolation.
    - Thử nghiệm chạy trên MySQL 5.5.53 và MariaDB 10.1.10.
- [ex:spring-self-invocation] — tài liệu Spring Framework 7.0.9 ghi rõ lời gọi method trong cùng object không tạo transaction ở proxy mode[^spring-tx].

## Câu hỏi tự kiểm tra

- Ở lab bước 4, cả hai bước đã nằm trong một transaction. Vì sao vẫn mất quyết định của A? Sửa câu lệnh nào để B đổi 0 dòng?
- Thao tác "duyệt yêu cầu" nên mở và đóng transaction ở đâu trong code của bạn? Nêu điều kiện khiến cách tổ chức đó hợp lý.
- Trong Spring, `approve()` có `@Transactional` được gọi từ `handle()` cùng class. Chuyện gì xảy ra, và có những cách sửa nào?
- Gửi email duyệt yêu cầu: so sánh chạy việc gửi ngay trong transaction, dùng listener `AFTER_COMMIT`, và ghi sự kiện vào database trong cùng transaction như event publication registry của Spring Modulith. Mỗi cách đánh đổi gì?

## Chủ đề liên quan và nguồn kiểm chứng
