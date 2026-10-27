---
id: db-isolation-levels
title: Isolation level
parent: db-relational
summary: Các hiện tượng đọc ghi đồng thời và mức isolation mỗi database thực sự cung cấp.
contentStatus: verified
volatility: slow
verifiedAt: 2026-10-15
verifiedBy: claude
prerequisites:
  - db-transaction-acid
related:
  - db-mvcc
  - db-locking
  - db-transaction-boundary
sources:
  - id: pg-iso
    url: https://www.postgresql.org/docs/16/transaction-iso.html
    title: "PostgreSQL 16 — 13.2. Transaction Isolation"
    supports: "Định nghĩa dirty read, nonrepeatable read, phantom read, serialization anomaly; PostgreSQL chỉ hiện thực ba mức, Read Uncommitted chạy như Read Committed; Read Committed là mặc định, mỗi câu SELECT thấy snapshot lúc câu lệnh bắt đầu, đủ cho nhiều ứng dụng nhưng không đủ cho mọi trường hợp; Repeatable Read cho cái nhìn ổn định hoàn toàn, không có phantom read, lỗi khi transaction khác đã sửa hoặc xóa dòng và commit; thực thi quy tắc nghiệp vụ ở Repeatable Read khó đúng nếu không khóa tường minh; Serializable dùng SSI, tỷ lệ lỗi serialization có thể tăng khi predicate lock gộp lên mức bảng hoặc khi quét tuần tự; với một số môi trường Serializable là lựa chọn hiệu năng tốt nhất so với khóa tường minh; lỗi có SQLSTATE 40001, phải chạy lại cả transaction; ở Read Committed, sau khi chờ dòng bị khóa, điều kiện WHERE được kiểm lại trên phiên bản mới của dòng; ở Repeatable Read chỉ transaction có ghi mới phải chạy lại, transaction chỉ đọc không có xung đột serialization nhưng vẫn có thể thấy trạng thái không ứng với thứ tự tuần tự nào (ví dụ bản ghi điều khiển lô); SERIALIZABLE READ ONLY DEFERRABLE chờ tới khi xác lập được là an toàn."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: pg-retry
    url: https://www.postgresql.org/docs/16/mvcc-serialization-failure-handling.html
    title: "PostgreSQL 16 — 13.5. Serialization Failure Handling"
    supports: "Repeatable Read và Serializable có thể gây lỗi 40001; nên cân nhắc retry cả deadlock 40P01, đôi khi 23505 và 23P01 nhưng cẩn thận hơn; phải chạy lại toàn bộ transaction gồm cả logic quyết định câu SQL và giá trị; retry không bảo đảm thành công."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: ora-concurrency
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/data-concurrency-and-consistency.html
    title: "Oracle AI Database Concepts — Data Concurrency and Consistency"
    supports: "Oracle có Read Committed (mặc định), Serializable và chế độ Read-Only; ở Serializable, transaction chỉ thấy thay đổi đã commit lúc transaction (không phải câu truy vấn) bắt đầu và thay đổi của chính nó; transaction serializable sửa hoặc xóa dữ liệu mà transaction khác đã sửa và commit sau khi nó bắt đầu thì nhận ORA-08177."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-15
  - id: acidrain
    url: https://www.bailis.org/papers/acidrain-sigmod2017.pdf
    title: "Warszawski & Bailis — ACIDRain: Concurrency-Related Attacks on Database-Backed Web Applications (SIGMOD 2017; không nêu phiên bản Oracle khi nói về serializability)"
    supports: "Phân tích 12 ứng dụng thương mại điện tử tự host phổ biến, triển khai trên hơn 2 triệu website, xác minh 22 tấn công; 5 lỗ hổng thuộc loại level-based (do mức isolation), 17 thuộc loại scope-based (do không bao thao tác trong transaction đúng phạm vi) và xảy ra bất kể mức isolation; thử nghiệm trên MySQL 5.5.53 và MariaDB 10.1.10; sản phẩm chủ lực của Oracle và SAP HANA không có serializability như một tùy chọn."
    checkedAt: 2026-10-14
  - id: pg-applevel
    url: https://www.postgresql.org/docs/16/applevel-consistency.html
    title: "PostgreSQL 16 — 13.4. Data Consistency Checks at the Application Level"
    supports: "Serializable là Repeatable Read cộng theo dõi không chặn các mẫu xung đột đọc ghi nguy hiểm và rollback một transaction khi phát hiện; khi có ghi không serializable, phải dùng SELECT FOR UPDATE, SELECT FOR SHARE hoặc LOCK TABLE; SELECT FOR UPDATE/FOR SHARE chỉ khóa các dòng trả về, LOCK TABLE khóa cả bảng; khó thực thi quy tắc nghiệp vụ ở Read Committed. Dựa vào khóa tường minh thì dùng Read Committed, hoặc ở Repeatable Read phải lấy khóa trước khi chạy truy vấn."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: pg-set-transaction
    url: https://www.postgresql.org/docs/16/sql-set-transaction.html
    title: "PostgreSQL 16 — SET TRANSACTION"
    supports: "DEFERRABLE chỉ có tác dụng khi transaction cũng là SERIALIZABLE và READ ONLY; khi đó transaction có thể phải chờ lúc lấy snapshot đầu tiên, sau đó chạy không có chi phí thường lệ của SERIALIZABLE và không có rủi ro gây ra hay bị hủy do lỗi serialization; chế độ này hợp với báo cáo chạy lâu hoặc backup."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
examples:
  - id: lab-isolation
    kind: lab-run
    title: "Năm kịch bản đồng thời trên PostgreSQL 16.15, gồm write skew"
    path: lab/experiments/db-isolation-levels
    checkedAt: 2026-10-14
  - id: acidrain-case
    kind: research
    title: "ACIDRain (2017): 22 tấn công ở 12 ứng dụng thương mại điện tử, 5 do mức isolation, 17 do dùng transaction sai phạm vi"
    url: https://www.bailis.org/papers/acidrain-sigmod2017.pdf
    checkedAt: 2026-10-14
changelog:
  - date: 2026-10-14
    note: Claude soạn bản nháp đầu tiên và chạy thử nghiệm trên PostgreSQL 16.15.
  - date: 2026-10-14
    note: "Kiểm chứng: sửa số liệu ACIDRain (5 do isolation, 17 do phạm vi transaction), thêm nguồn cho định nghĩa hiện tượng, điều kiện của lỗi ở Repeatable Read, hướng dẫn retry của PostgreSQL 16, lưu ý về Serializable của Oracle; bỏ nhận định hiệu năng không có số đo."
  - date: 2026-10-15
    note: "Phản biện vòng 2: so sánh Serializable dựa trên định nghĩa trong tài liệu hiện hành, giới hạn lỗi 40001 cho transaction có ghi và thêm cảnh báo snapshot cho báo cáo, nêu điều kiện của SELECT FOR UPDATE và của cách đưa điều kiện vào UPDATE."
  - date: 2026-10-15
    note: "Phản biện vòng 3: sửa rollback cả transaction (không phải câu lệnh), thêm điều kiện lấy khóa trước ở Repeatable Read, ghi rõ lab chưa chạy FOR UPDATE, thêm nguồn cho DEFERRABLE dùng với báo cáo."
---

## Vấn đề cần giải quyết

Nhiều transaction chạy cùng lúc trên cùng dữ liệu. Bắt mỗi transaction chờ transaction trước xong hẳn thì mất khả năng chạy đồng thời. Để chúng chạy hoàn toàn tự do thì một transaction có thể đọc dữ liệu đang sửa dở, hoặc ra quyết định dựa trên dữ liệu đã cũ.

Isolation level quy định transaction được phép thấy những gì của các transaction khác. Điều quan trọng: **tên mức giống nhau nhưng mỗi sản phẩm hiện thực khác nhau**.

## Cơ chế và luồng hoạt động

Bốn hiện tượng dùng để định nghĩa mức isolation, theo tài liệu PostgreSQL 16[^pg-iso]:

- **Dirty read:** đọc dữ liệu do một transaction chưa commit ghi.
- **Nonrepeatable read:** đọc lại dữ liệu đã đọc và thấy nó đã bị một transaction khác sửa (transaction đó đã commit sau lần đọc đầu).
- **Phantom read:** chạy lại một truy vấn theo điều kiện và thấy tập dòng thỏa điều kiện đã đổi do một transaction vừa commit.
- **Serialization anomaly:** kết quả của một nhóm transaction đã commit không khớp với bất kỳ thứ tự chạy lần lượt nào.

**PostgreSQL 16**[^pg-iso]:

| Mức | Hành vi |
| --- | --- |
| Read Uncommitted | Chạy như Read Committed |
| Read Committed (mặc định) | Mỗi câu `SELECT` thấy snapshot lúc câu lệnh bắt đầu |
| Repeatable Read | Thấy snapshot ổn định từ câu lệnh đầu tiên của transaction; không có phantom read. Nếu dòng định sửa đã bị transaction khác sửa hoặc xóa (không chỉ khóa) và commit, transaction bị hủy với `could not serialize access due to concurrent update` |
| Serializable | Serializable Snapshot Isolation: thêm kiểm tra để phát hiện serialization anomaly |

Lỗi serialization trên PostgreSQL luôn có SQLSTATE `40001`. Ứng dụng phải hủy transaction và chạy lại **từ đầu**[^pg-iso].

**Oracle AI Database (Release 26)** có Read Committed (mặc định), Serializable và chế độ Read-Only[^ora-concurrency]. Ở Serializable, transaction chỉ thấy thay đổi đã commit lúc transaction (không phải câu truy vấn) bắt đầu. Nếu nó sửa hoặc xóa dữ liệu mà transaction khác đã sửa và commit sau thời điểm đó, nó nhận `ORA-08177`[^ora-concurrency]. Oracle không có mức Repeatable Read riêng.

Tên "Serializable" không có nghĩa giống nhau ở hai sản phẩm. Định nghĩa của Oracle ở trên dựa trên thời điểm bắt đầu transaction và lỗi khi sửa dòng đã bị đổi[^ora-concurrency]. Serializable của PostgreSQL 16 là Repeatable Read cộng thêm việc theo dõi các mẫu xung đột đọc ghi nguy hiểm; khi phát hiện mẫu có thể tạo vòng trong thứ tự thực thi, nó rollback một transaction[^pg-applevel]. Tài liệu Oracle không nói Serializable của nó chặn write skew. Bài báo ACIDRain năm 2017 (không nêu phiên bản Oracle) ghi rằng sản phẩm chủ lực của Oracle không có serializability như một tùy chọn[^acidrain]. Kịch bản write skew trong lab mới chạy trên PostgreSQL, chưa chạy trên Oracle.

## Điều kiện áp dụng, lợi ích và đánh đổi

- **Read Committed** (PostgreSQL 16) đủ cho nhiều ứng dụng, nhanh và đơn giản, nhưng không đủ cho mọi trường hợp[^pg-iso]. Quy tắc nghiệp vụ dạng "đọc, kiểm tra, rồi ghi" trải trên nhiều câu lệnh không được bảo vệ.
- **Repeatable Read** (PostgreSQL 16) cho mỗi transaction một cái nhìn ổn định hoàn toàn[^pg-iso]. Chỉ transaction có ghi mới có thể nhận lỗi `40001` và phải chạy lại; transaction chỉ đọc không bao giờ có xung đột serialization[^pg-iso]. Dù vậy, ngay cả transaction chỉ đọc ở mức này vẫn có thể thấy một trạng thái không ứng với thứ tự tuần tự nào. Ví dụ của tài liệu: thấy bản ghi điều khiển báo một lô đã xong nhưng không thấy một bản ghi chi tiết thuộc lô đó[^pg-iso]. Muốn tránh điều này, dùng `SERIALIZABLE READ ONLY DEFERRABLE`: transaction có thể phải chờ lúc lấy snapshot đầu tiên, sau đó chạy không có rủi ro bị hủy do lỗi serialization. Tài liệu ghi chế độ này hợp với báo cáo chạy lâu hoặc backup[^pg-iso][^pg-set-transaction]. Tài liệu cũng cảnh báo: thực thi quy tắc nghiệp vụ ở mức này khó đúng nếu không khóa tường minh[^pg-iso].
- **Serializable** (PostgreSQL 16) phát hiện cả write skew (lab ở mục Ví dụ). Tỷ lệ transaction phải chạy lại có thể tăng khi predicate lock bị gộp lên mức bảng, hoặc khi truy vấn quét tuần tự[^pg-iso]. Tài liệu nhận xét: so với chi phí và việc chờ của khóa tường minh, Serializable là lựa chọn hiệu năng tốt nhất cho một số môi trường[^pg-iso].

**Cách bảo vệ một quy tắc nghiệp vụ, tùy hình dạng của quy tắc:**

- Quy tắc nằm trên chính dòng đang sửa (ví dụ "chỉ duyệt khi còn pending"): đưa điều kiện vào câu `UPDATE` (xem bài Ranh giới transaction). Trên PostgreSQL 16 ở Read Committed, cách này đúng vì sau khi chờ dòng bị khóa, điều kiện `WHERE` được kiểm lại trên phiên bản mới của dòng[^pg-iso]. Ở Repeatable Read, transaction chạy câu lệnh đó bị rollback với lỗi `could not serialize access due to concurrent update` nếu dòng đã bị transaction khác sửa và commit[^pg-iso], nên ứng dụng phải chạy lại transaction.
- Quy tắc trải trên nhiều dòng (ví dụ "phòng phải còn ít nhất một người duyệt"; lab đã chạy kịch bản này ở Repeatable Read và Serializable, chưa chạy với `FOR UPDATE`): `SELECT ... FOR UPDATE` chỉ khóa các dòng truy vấn trả về[^pg-applevel] (xem bài Locking). Cách này hợp khi quy tắc chỉ đọc các dòng đã có, như ví dụ trên. Nếu quy tắc có thể bị phá bởi một dòng mới được chèn, dòng đó chưa tồn tại nên không bị khóa; khi đó dùng Serializable kèm retry, hoặc `LOCK TABLE` để khóa cả bảng[^pg-applevel]. Nếu dựa vào khóa tường minh ở Repeatable Read, phải lấy khóa trước khi chạy truy vấn[^pg-applevel].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Tưởng mặc định là Serializable.** Cả PostgreSQL 16 và Oracle (Release 26) mặc định Read Committed[^pg-iso][^ora-concurrency].
- **Đặt Serializable mà không retry.** Dấu hiệu: lỗi `40001` hoặc `ORA-08177` lộ ra người dùng thay vì được chạy lại.
- **Chỉ retry câu lệnh lỗi.** PostgreSQL 16 yêu cầu chạy lại toàn bộ transaction, gồm cả logic quyết định câu SQL nào và giá trị nào. Tài liệu cũng khuyên cân nhắc retry deadlock `40P01`. Lỗi `23505` và `23P01` cũng có thể retry, nhưng cần cẩn thận hơn vì có thể là lỗi lâu dài. Retry cũng không bảo đảm lần sau thành công[^pg-retry].
- **Write skew.** Hai transaction cùng đọc một điều kiện, mỗi bên sửa một dòng khác nhau, và cùng nhau phá vỡ điều kiện đó. Repeatable Read của PostgreSQL 16 không chặn được (lab).
- **Mang hiểu biết từ sản phẩm này sang sản phẩm khác.** Repeatable Read của PostgreSQL 16 không cho phantom read[^pg-iso]; Oracle không có mức này; và định nghĩa Serializable của hai bên khác nhau[^ora-concurrency][^pg-applevel].

## Ví dụ thực tế

- [ex:lab-isolation] — năm kịch bản trên PostgreSQL 16.15, trong bối cảnh duyệt yêu cầu:
    - Read Committed: hai lần đọc trong một transaction thấy 2 rồi 1 yêu cầu pending.
    - Repeatable Read: lần đọc thứ hai vẫn thấy dòng 1 và 2 là pending, không thấy dòng 4 mới chèn.
    - Repeatable Read: cập nhật dòng đã bị sửa và commit → `40001 could not serialize access due to concurrent update`.
    - Write skew ở Repeatable Read: hai admin mỗi người tắt một người duyệt; cả hai commit; phòng IT còn 0 người duyệt.
    - Cùng kịch bản ở Serializable: commit thứ hai nhận `40001 ... read/write dependencies among transactions`; phòng IT còn 1 người duyệt.
- [ex:acidrain-case] — nghiên cứu ACIDRain (SIGMOD 2017) phân tích 12 ứng dụng thương mại điện tử tự host, triển khai trên hơn 2 triệu website, và xác minh 22 tấn công[^acidrain]. Chỉ 5 trong 22 lỗ hổng do mức isolation. 17 lỗ hổng còn lại do thao tác không được bao trong transaction đúng phạm vi, và xảy ra bất kể mức isolation nào[^acidrain]. Thử nghiệm chạy trên MySQL 5.5.53 và MariaDB 10.1.10[^acidrain].

## Câu hỏi tự kiểm tra

- Ở Read Committed trên PostgreSQL 16, vì sao hai câu `SELECT` trong cùng transaction có thể ra kết quả khác nhau?
- Mô tả write skew bằng ví dụ người duyệt. Vì sao trên PostgreSQL 16, Repeatable Read không chặn được còn Serializable thì có? Có những cách nào khác để chặn?
- Một transaction trên PostgreSQL nhận lỗi `40001`. Ứng dụng nên làm gì, và vì sao không chỉ chạy lại câu lệnh lỗi?
- ACIDRain cho thấy 17 trên 22 lỗ hổng không phụ thuộc mức isolation. Điều đó nói gì về việc "chỉ cần nâng isolation lên Serializable"?
- Khi chuyển một ứng dụng dựa vào Serializable của PostgreSQL sang Oracle, cần kiểm lại điều gì?

## Chủ đề liên quan và nguồn kiểm chứng
