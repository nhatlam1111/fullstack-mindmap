---
id: db-transaction-acid
title: Transaction và ACID
parent: db-relational
summary: "Nhóm thao tác thành một đơn vị: atomicity, consistency, isolation, durability."
contentStatus: verified
volatility: stable
verifiedAt: 2026-10-15
verifiedBy: claude
prerequisites:
  - db-tables-keys-constraints
related:
  - db-isolation-levels
  - db-transaction-boundary
  - db-distributed-transactions
  - db-mvcc
sources:
  - id: ora-transactions
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/transactions.html
    title: "Oracle AI Database Concepts — Transactions"
    supports: "Transaction là đơn vị công việc logic, atomic; định nghĩa bốn tính chất ACID; statement-level atomicity: câu lệnh lỗi không làm mất công việc trước đó trong transaction; COMMIT, ROLLBACK, SAVEPOINT; COMMIT và ROLLBACK toàn bộ transaction đều giải phóng khóa của transaction; Consistency: transaction đưa database từ trạng thái nhất quán này sang trạng thái nhất quán khác; thoát bình thường khỏi đa số công cụ Oracle sẽ commit ngầm; COMMIT ngầm trước và sau mỗi câu DDL; distributed transaction cập nhật nhiều database qua database link, two-phase commit bảo đảm tất cả cùng commit hoặc cùng hoàn tác; ROLLBACK TO SAVEPOINT nhả các khóa lấy sau savepoint và giữ các khóa lấy trước đó."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-15
  - id: pg-tx-tutorial
    url: https://www.postgresql.org/docs/16/tutorial-transactions.html
    title: "PostgreSQL 16 — 3.4. Transactions"
    supports: "Transaction gói nhiều bước thành một thao tác tất cả hoặc không gì cả; trạng thái trung gian không hiện với transaction khác, lỗi giữa chừng thì không bước nào ảnh hưởng database; đã commit và được xác nhận thì không mất dù máy sập ngay sau đó; không có BEGIN thì mỗi câu lệnh được bọc BEGIN và COMMIT ngầm; một số thư viện client tự gửi BEGIN và COMMIT; ROLLBACK TO là cách duy nhất lấy lại quyền điều khiển transaction đang ở trạng thái aborted mà không rollback toàn bộ; ví dụ chuyển 100 đô từ Alice sang Bob bằng bốn câu UPDATE."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg-async-commit
    url: https://www.postgresql.org/docs/16/wal-async-commit.html
    title: "PostgreSQL 16 — 30.4. Asynchronous Commit"
    supports: "Asynchronous commit cho transaction hoàn tất nhanh hơn, đổi lại những transaction gần nhất có thể mất nếu database sập; chế độ commit do tham số synchronous_commit quyết định cho từng transaction."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg-client-config
    url: https://www.postgresql.org/docs/16/runtime-config-client.html
    title: "PostgreSQL 16 — 20.11. Client Connection Defaults"
    supports: "idle_in_transaction_session_timeout giúp phiên nghỉ không giữ khóa quá lâu; một transaction đang mở ngăn VACUUM dọn các dòng vừa chết mà có thể chỉ transaction đó còn thấy."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg-wal-config
    url: https://www.postgresql.org/docs/16/runtime-config-wal.html
    title: "PostgreSQL 16 — 20.5. Write Ahead Log (synchronous_commit)"
    supports: "Ở synchronous_commit = off, không chờ WAL ghi xuống đĩa nên có độ trễ giữa lúc báo commit và lúc an toàn trước sự cố; máy sập có thể làm mất vài transaction vừa báo commit, nhưng trạng thái database như thể chúng bị hủy sạch, không có rủi ro mất nhất quán."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
examples:
  - id: lab-acid
    kind: lab-run
    title: "Duyệt yêu cầu hai bước, bước hai lỗi: có và không có transaction"
    path: lab/experiments/db-transaction-acid
    checkedAt: 2026-10-14
  - id: pg-transfer
    kind: official-doc
    title: "Ví dụ chuyển tiền trong tài liệu PostgreSQL 16"
    url: https://www.postgresql.org/docs/16/tutorial-transactions.html
    checkedAt: 2026-10-14
changelog:
  - date: 2026-10-14
    note: Claude soạn bản nháp đầu tiên và chạy thử nghiệm trên PostgreSQL 16.15.
  - date: 2026-10-14
    note: "Kiểm chứng: thêm điều kiện của durability (asynchronous commit), hệ quả của statement-level atomicity trên Oracle, ROLLBACK TO SAVEPOINT, nguồn cho autocommit và thời gian giữ khóa; sửa nhận định 'transaction chỉ bao một database' thành transaction cục bộ, nhắc distributed transaction."
  - date: 2026-10-15
    note: "Phản biện vòng 2: ROLLBACK cũng giải phóng khóa trên Oracle, thêm nguồn cho synchronous_commit = off, thay câu Consistency không có nguồn bằng định nghĩa của Oracle."
  - date: 2026-10-15
    note: "Phản biện vòng 3: thêm ngoại lệ ROLLBACK TO SAVEPOINT khi nói về thời gian giữ khóa."
  - date: 2026-10-29
    note: "Bỏ chỗ nhắc bài thực hành cũ; nhận định, nguồn và ví dụ không đổi."
  - date: 2026-10-29
    note: "Sửa câu chữ ở đoạn nhắc lab sau phản biện; nhận định, nguồn và ví dụ không đổi."
  - date: 2026-10-29
    note: "Sửa câu chữ theo góp ý minor của vòng phản biện 29/10: câu nhắc lab nói lại rằng lab tái hiện trạng thái nửa vời khi không có transaction."
  - date: 2026-10-29
    note: "Phản biện vòng 1 (chặng 1): câu nhắc lab nói đúng là hai lệnh chạy ở chế độ tự commit, mỗi lệnh một transaction riêng."
  - date: 2026-10-29
    note: "Phản biện vòng 2 (chặng 1): không còn blocker hay major; giữ kiểm chứng, giữ verifiedAt cũ vì chỉ các đoạn đã đổi được phản biện."
---

## Vấn đề cần giải quyết

Một thao tác nghiệp vụ thường gồm nhiều câu lệnh. Trong lab ở mục Ví dụ, duyệt một yêu cầu nghĩa là đổi trạng thái **và** ghi một dòng lịch sử. Nếu lệnh thứ nhất thành công còn lệnh thứ hai lỗi, dữ liệu rơi vào trạng thái nửa vời; lab tái hiện đúng trạng thái này khi hai lệnh chạy ở chế độ tự commit, mỗi lệnh là một transaction riêng.

Transaction gói nhiều bước thành một thao tác **tất cả hoặc không gì cả**[^pg-tx-tutorial].

## Cơ chế và luồng hoạt động

Một transaction bắt đầu, chạy các câu lệnh, rồi kết thúc bằng `COMMIT` (giữ mọi thay đổi) hoặc `ROLLBACK` (bỏ mọi thay đổi kể từ lần commit hay rollback trước)[^ora-transactions]. Bốn tính chất ACID, theo định nghĩa của Oracle AI Database (Release 26)[^ora-transactions]:

| Tính chất | Nghĩa |
| --- | --- |
| Atomicity | Mọi việc trong transaction cùng được thực hiện hoặc cùng không; không có transaction làm dở |
| Consistency | Transaction đưa database từ một trạng thái nhất quán sang một trạng thái nhất quán khác |
| Isolation | Thay đổi của một transaction không hiện với transaction khác cho tới khi commit |
| Durability | Thay đổi đã commit là vĩnh viễn; cơ chế phục hồi bảo đảm không mất |

Dòng Isolation ở trên chỉ loại trừ việc đọc dữ liệu chưa commit. Bảo đảm thực tế về đọc ghi đồng thời phụ thuộc mức isolation (xem bài Mức isolation). Tài liệu Oracle định nghĩa Consistency là transaction đưa database từ một trạng thái nhất quán sang một trạng thái nhất quán khác[^ora-transactions]. Những quy tắc nào database tự kiểm tra được thì xem bài Bảng, khóa và constraint.

PostgreSQL 16 mô tả cùng ý: trạng thái trung gian không hiện với transaction khác, và nếu lỗi giữa chừng thì không bước nào ảnh hưởng tới database[^pg-tx-tutorial]. Không có `BEGIN` thì mỗi câu lệnh được bọc `BEGIN` và `COMMIT` ngầm. Một số thư viện client còn tự gửi `BEGIN`, `COMMIT`, nên cần đọc tài liệu của driver đang dùng[^pg-tx-tutorial].

**Khi một câu lệnh lỗi giữa transaction**, hai sản phẩm xử lý khác nhau:

- Oracle (Release 26) có statement-level atomicity: chỉ câu lệnh lỗi bị hoàn tác, công việc trước đó trong transaction vẫn còn[^ora-transactions]. Vì vậy nếu ứng dụng vẫn `COMMIT` sau lỗi, bước đầu được lưu mà không có bước sau. Ứng dụng phải tự `ROLLBACK`. Thoát bình thường khỏi đa số công cụ Oracle cũng commit ngầm transaction đang mở[^ora-transactions].
- PostgreSQL 16 đưa transaction vào trạng thái aborted. Trong lab, câu lệnh tiếp theo bị từ chối với `25P02 current transaction is aborted`. Muốn chạy tiếp mà không bỏ cả transaction thì phải `ROLLBACK TO` một savepoint đặt trước đó[^pg-tx-tutorial].

**Durability có điều kiện.** Đã commit và được xác nhận thì không mất dù máy sập ngay sau đó[^pg-tx-tutorial]. Ngoại lệ trên PostgreSQL 16 là asynchronous commit: transaction hoàn tất nhanh hơn, đổi lại những transaction gần nhất có thể mất nếu database sập[^pg-async-commit]. Chế độ này bật khi `synchronous_commit = off`. Khi đó máy sập có thể làm mất vài transaction đã báo commit, nhưng database vẫn ở trạng thái như thể các transaction đó bị hủy sạch, không bị mất nhất quán[^pg-wal-config].

## Điều kiện áp dụng, lợi ích và đánh đổi

Dùng transaction cho mọi nhóm thay đổi phải đúng cùng nhau. Lợi ích là ứng dụng không phải tự viết logic hoàn tác cho từng kiểu lỗi.

Đánh đổi:

- **Khóa giữ tới khi kết thúc.** Trên Oracle (Release 26), khóa của transaction được giữ tới khi transaction kết thúc bằng `COMMIT` hoặc `ROLLBACK`; ngoại lệ là `ROLLBACK TO SAVEPOINT` nhả các khóa lấy sau savepoint đó[^ora-transactions], nên transaction càng dài thì khóa giữ càng lâu.
- **Dọn dữ liệu cũ bị chặn.** Trên PostgreSQL 16, một transaction đang mở có thể ngăn VACUUM dọn những dòng vừa chết mà chỉ nó còn thấy[^pg-client-config]. Bài MVCC đo cụ thể khi nào điều này xảy ra.

Hệ quả: giữ transaction ngắn, không chờ người dùng thao tác trong lúc transaction đang mở.

**Phạm vi của một transaction cục bộ** là các thay đổi trong database đó. Gửi email hay gọi API bên ngoài không được hoàn tác khi `ROLLBACK`. Bài Ranh giới transaction bàn cách làm việc này sau khi commit. Oracle có distributed transaction cập nhật nhiều database qua database link; two-phase commit bảo đảm các database cùng commit hoặc cùng hoàn tác[^ora-transactions].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Chạy từng lệnh ở chế độ tự commit.** Trên PostgreSQL 16, không có `BEGIN` thì mỗi câu lệnh là một transaction riêng[^pg-tx-tutorial]. Dấu hiệu: có yêu cầu `approved` mà không có dòng lịch sử nào, như bước một của lab.
- **Bắt lỗi rồi chạy tiếp trên PostgreSQL.** Code nuốt lỗi của một câu lệnh rồi gửi câu tiếp theo sẽ nhận `25P02`. Dấu hiệu: một lỗi ban đầu kéo theo hàng loạt lỗi "transaction is aborted". Cách sửa: rollback, hoặc đặt savepoint trước bước có thể lỗi và `ROLLBACK TO` savepoint đó[^pg-tx-tutorial].
- **Commit sau lỗi trên Oracle.** Vì chỉ câu lệnh lỗi bị hoàn tác[^ora-transactions], dấu hiệu là dữ liệu nửa vời giống hệt khi không dùng transaction.
- **Trộn DDL vào transaction trên Oracle.** Oracle (Release 26) chạy `COMMIT` ngầm trước và sau mỗi câu DDL như `CREATE`, `ALTER`, `DROP`[^ora-transactions]. Dấu hiệu: `ROLLBACK` sau một câu DDL không hoàn tác được các thay đổi dữ liệu trước nó.

## Ví dụ thực tế

- [ex:lab-acid] — trên PostgreSQL 16.15:
    - Không có transaction: yêu cầu 1 thành `approved` nhưng có 0 dòng lịch sử, vì lệnh thứ hai vi phạm `NOT NULL` (23502).
    - Có transaction: cùng lỗi đó khiến câu lệnh sau bị từ chối với `25P02`; sau `ROLLBACK`, yêu cầu 2 vẫn `pending`.
    - Khi cả hai bước đúng, commit lưu cả hai.
- [ex:pg-transfer] — tài liệu PostgreSQL 16 dùng ví dụ chuyển 100 đô từ tài khoản Alice sang Bob, gồm bốn câu `UPDATE` trên bảng tài khoản và bảng chi nhánh phải cùng thành công[^pg-tx-tutorial].

## Câu hỏi tự kiểm tra

- Duyệt yêu cầu gồm đổi trạng thái và ghi lịch sử. Vẽ lại điều xảy ra khi lệnh thứ hai lỗi, có và không có transaction.
- Trong một transaction, câu lệnh thứ ba lỗi. Oracle và PostgreSQL xử lý các câu lệnh tiếp theo khác nhau thế nào, và ứng dụng phải làm gì trên mỗi sản phẩm để không lưu dữ liệu nửa vời?
- Vì sao không nên gửi email thông báo bên trong transaction duyệt yêu cầu?
- Durability bảo đảm điều gì? Nêu một cấu hình của PostgreSQL 16 khiến transaction đã báo thành công vẫn có thể mất.

## Chủ đề liên quan và nguồn kiểm chứng
