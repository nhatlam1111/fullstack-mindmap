---
id: db-mvcc
title: MVCC
parent: db-relational
summary: Giữ nhiều phiên bản dữ liệu để đọc không chặn ghi; cách Oracle và PostgreSQL làm khác nhau.
contentStatus: verified
volatility: slow
verifiedAt: 2026-10-15
verifiedBy: claude
prerequisites:
  - db-transaction-acid
related:
  - db-isolation-levels
  - db-locking
  - db-performance-monitoring
sources:
  - id: pg-mvcc
    url: https://www.postgresql.org/docs/16/mvcc-intro.html
    title: "PostgreSQL 16 — 13.1. Introduction (Concurrency Control)"
    supports: "PostgreSQL dùng mô hình đa phiên bản; mỗi câu SQL thấy một snapshot dữ liệu như ở một thời điểm trước; khóa lấy để đọc không xung đột với khóa lấy để ghi dữ liệu, nên đọc không chặn ghi và ghi không chặn đọc."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg-iso
    url: https://www.postgresql.org/docs/16/transaction-iso.html
    title: "PostgreSQL 16 — 13.2. Transaction Isolation"
    supports: "Ở Read Committed, mỗi câu SELECT thấy snapshot lúc câu lệnh bắt đầu; ở Repeatable Read, transaction thấy snapshot ổn định từ câu lệnh đầu tiên; ở Read Committed, người ghi thứ hai chờ người ghi đầu commit hoặc rollback."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg-locking
    url: https://www.postgresql.org/docs/16/explicit-locking.html
    title: "PostgreSQL 16 — 13.3. Explicit Locking"
    supports: "SELECT lấy khóa ACCESS SHARE trên bảng, chỉ xung đột với ACCESS EXCLUSIVE; khóa dòng không ảnh hưởng việc đọc, chỉ chặn người ghi và người khóa cùng dòng."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg-vacuum
    url: https://www.postgresql.org/docs/16/routine-vacuuming.html
    title: "PostgreSQL 16 — 25.1. Routine Vacuuming"
    supports: "UPDATE và DELETE không xóa ngay phiên bản cũ vì nó có thể còn hiện với transaction khác; VACUUM thường không trả dung lượng cho hệ điều hành; vacuum theo lịch cố định dễ để bảng phình khi update tăng đột biến, autovacuum giảm vấn đề vì lên lịch theo lượng update; transaction ID 32 bit, phải vacuum mọi bảng ít nhất mỗi hai tỷ transaction; cảnh báo khi còn 40 triệu, từ chối cấp transaction ID mới khi còn dưới 3 triệu; ở các bản trước đôi khi phải dừng postmaster và vacuum ở single-user mode; kiểm tra tuổi bằng SELECT datname, age(datfrozenxid) FROM pg_database; tìm transaction mở lâu bằng age(backend_xid) hoặc age(backend_xmin) trong pg_stat_activity."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: pg-syscols
    url: https://www.postgresql.org/docs/16/ddl-system-columns.html
    title: "PostgreSQL 16 — 5.5. System Columns"
    supports: "ctid là vị trí vật lý của phiên bản dòng và đổi khi dòng bị update; xmin là transaction ID của transaction đã chèn phiên bản dòng; mỗi lần update tạo một phiên bản mới cho cùng dòng logic."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg-client-config
    url: https://www.postgresql.org/docs/16/runtime-config-client.html
    title: "PostgreSQL 16 — 20.11. Client Connection Defaults"
    supports: "Một transaction đang mở ngăn VACUUM dọn các dòng vừa chết mà có thể chỉ transaction đó còn thấy; idle_in_transaction_session_timeout chấm dứt phiên nghỉ trong transaction quá lâu."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg14-release
    url: https://www.postgresql.org/docs/release/14.0/
    title: "PostgreSQL 14.0 Release Notes (2021-09-30)"
    supports: "PostgreSQL 14 tăng thời gian cảnh báo và giới hạn cứng trước transaction ID wraparound; VACUUM tự động mạnh tay hơn khi gần wraparound."
    product: PostgreSQL
    version: "14"
    checkedAt: 2026-10-14
  - id: ora-concurrency
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/data-concurrency-and-consistency.html
    title: "Oracle AI Database Concepts — Data Concurrency and Consistency"
    supports: "Oracle tạo bản ghi undo khi dữ liệu thay đổi, dùng undo để đọc nhất quán; người đọc và người ghi không chặn nhau; người ghi một dòng chặn người ghi khác cùng dòng; báo cáo chạy lâu có thể gặp lỗi snapshot too old khi undo cần cho đọc nhất quán đã bị dùng lại, đặt undo retention phù hợp để tránh; người đọc không khóa dòng nên không bao giờ chặn người ghi, trừ SELECT ... FOR UPDATE."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-15
  - id: sentry-wraparound
    url: https://blog.sentry.io/transaction-id-wraparound-in-postgres/
    title: "Sentry — Transaction ID Wraparound in Postgres (23/7/2015)"
    supports: "Ngày 20/7/2015, database của Sentry ngừng nhận ghi do transaction ID wraparound, Sentry ngừng gần hết một ngày làm việc ở Mỹ; Sentry ghi nhiều và có bảng rất lớn, trước đó đặt autovacuum_freeze_max_age quá cao và cost delay quá lớn; họ cắt bỏ (truncate) một bảng lớn để khôi phục nhanh, chấp nhận mất dữ liệu bảng đó, rồi chỉnh lại autovacuum; bài không nêu phiên bản PostgreSQL."
    product: PostgreSQL
    checkedAt: 2026-10-14
  - id: mandrill-outage
    url: https://mailchimp.com/what-we-learned-from-the-recent-mandrill-outage/
    title: "Mailchimp — What we learned from the recent Mandrill outage (26/3/2019)"
    supports: "Từ 05:35 UTC ngày 4/2 tới 22:09 UTC ngày 5/2/2019, shard4 trong hệ Postgres của Mandrill gặp XID wraparound; autovacuum trên shard4 có lẽ đã tụt lại, Mailchimp không xác định chắc là tụt lại hay lỗi hẳn; ước tính cao nhất cho vacuum đầy đủ là 40 ngày; trong sự cố chỉ gửi được 80% email trong hàng đợi; sau đó thêm cảnh báo XID wraparound; bài không nêu phiên bản PostgreSQL."
    product: PostgreSQL
    checkedAt: 2026-10-14
examples:
  - id: lab-mvcc
    kind: lab-run
    title: "Phiên bản dòng, dead tuple và những transaction nào chặn VACUUM trên PostgreSQL 16.15"
    path: lab/experiments/db-mvcc
    checkedAt: 2026-10-15
  - id: sentry-case
    kind: public-case
    title: "Sentry, 7/2015: Postgres ngừng nhận ghi vì transaction ID wraparound"
    url: https://blog.sentry.io/transaction-id-wraparound-in-postgres/
    checkedAt: 2026-10-14
  - id: mandrill-case
    kind: public-case
    title: "Mailchimp Mandrill, 2/2019: một shard Postgres chạm giới hạn XID"
    url: https://mailchimp.com/what-we-learned-from-the-recent-mandrill-outage/
    checkedAt: 2026-10-14
changelog:
  - date: 2026-10-14
    note: Claude soạn bản nháp đầu tiên và chạy thử nghiệm trên PostgreSQL 16.15.
  - date: 2026-10-14
    note: "Kiểm chứng: sửa 'đọc không cần khóa' thành 'khóa đọc không xung đột với khóa ghi'; nêu đúng điều kiện transaction mở chặn VACUUM và đo thêm hai trường hợp Read Committed trong lab; ghi rõ hai sự cố Sentry, Mandrill xảy ra trước PostgreSQL 14; thêm undo retention của Oracle."
  - date: 2026-10-15
    note: "Phản biện vòng 2: chạy lại lab với truy vấn pg_stat_activity ở bước Repeatable Read, viết lại điều kiện VACUUM theo số đo (backend_xmin hoặc backend_xid), thêm điều kiện lịch cố định cho bảng phình, tách hành vi khóa đọc của PostgreSQL và Oracle."
  - date: 2026-10-15
    note: "Phản biện vòng 3: thêm điều kiện transaction ID cũ hơn dead tuple kèm số đo removable cutoff, khôi phục trích dẫn cho câu snapshot, gộp mô tả nguồn."
---

## Vấn đề cần giải quyết

Nếu người đọc phải chờ người ghi và người ghi phải chờ người đọc, một báo cáo dài sẽ chặn mọi thao tác duyệt yêu cầu, và ngược lại. MVCC (multiversion concurrency control) giải quyết bằng cách giữ **nhiều phiên bản** của dữ liệu. Mỗi câu lệnh đọc một snapshot[^pg-mvcc]. Trên PostgreSQL 16, khóa lấy để đọc không xung đột với khóa lấy để ghi[^pg-mvcc]. Trên Oracle (Release 26), người đọc không khóa dòng mình đọc, nên người đọc không bao giờ chặn người ghi; ngoại lệ là `SELECT ... FOR UPDATE`[^ora-concurrency].

Cái giá là phiên bản cũ phải được giữ ở đâu đó và dọn đi đúng lúc. Oracle và PostgreSQL làm việc này rất khác nhau, và mỗi cách có những sự cố riêng.

## Cơ chế và luồng hoạt động

**PostgreSQL 16 giữ phiên bản ngay trong bảng:**

1. `UPDATE` không sửa dòng tại chỗ; mỗi lần update tạo một phiên bản mới cho cùng dòng logic[^pg-syscols]. Phiên bản cũ chưa bị xóa vì có thể vẫn hiện với transaction khác[^pg-vacuum].
2. Mỗi phiên bản mang transaction ID của transaction đã chèn nó (cột hệ thống `xmin`); `ctid` là vị trí vật lý của phiên bản[^pg-syscols].
3. Snapshot quyết định câu lệnh thấy phiên bản nào. Ở Read Committed, mỗi câu lệnh lấy snapshot mới. Ở Repeatable Read và Serializable, cả transaction dùng một snapshot từ câu lệnh đầu tiên[^pg-iso].
4. Phiên bản bị thay hoặc xóa bởi transaction đã commit là "dead tuple". Phiên bản cũ không được xóa khi nó còn có thể hiện với transaction khác[^pg-vacuum]. Lab cho thấy điều kiện thực tế rộng hơn "còn snapshot nào thấy nó": VACUUM bị chặn bởi một transaction đang mở giữ snapshot cũ (`backend_xmin` khác NULL), và cả bởi một transaction đã ghi nên có transaction ID (`backend_xid` khác NULL) cũ hơn thao tác tạo ra dead tuple, kể cả khi transaction đó ghi vào bảng khác. Trong lab, B ghi trước khi A update, và VACUUM báo `removable cutoff: 1523`, đúng bằng `backend_xid` của B. Khi đó VACUUM báo các dòng là "dead but not yet removable". `VACUUM` (thường do autovacuum chạy) dọn chúng và đánh dấu chỗ trống để dùng lại, nhưng thường không trả dung lượng cho hệ điều hành[^pg-vacuum].
5. Transaction ID chỉ có 32 bit. Mọi bảng phải được vacuum ít nhất mỗi hai tỷ transaction, nếu không bộ đếm quay vòng (transaction ID wraparound) và dữ liệu cũ trở nên vô hình[^pg-vacuum].

**Khóa khi đọc trên PostgreSQL 16.** Đọc vẫn lấy khóa, nhưng là khóa nhẹ. `SELECT` lấy khóa `ACCESS SHARE` trên bảng; khóa này chỉ xung đột với `ACCESS EXCLUSIVE`, loại khóa mà nhiều dạng `ALTER TABLE` cần[^pg-locking]. Khóa dòng không ảnh hưởng việc đọc, chỉ chặn người ghi hoặc người khóa cùng dòng[^pg-locking]. Hai người cùng sửa một dòng thì người sau vẫn phải chờ người trước commit hoặc rollback[^pg-iso].

**Oracle AI Database (Release 26) giữ phiên bản cũ ngoài bảng.** Mỗi thay đổi tạo bản ghi undo chứa giá trị cũ, và Oracle dùng undo để cho câu truy vấn một góc nhìn nhất quán. Người đọc và người ghi không chặn nhau, nhưng người ghi một dòng chặn người ghi khác cùng dòng[^ora-concurrency].

## Điều kiện áp dụng, lợi ích và đánh đổi

Lợi ích: báo cáo, truy vấn đọc và thao tác ghi chạy song song mà không chờ nhau.

Đánh đổi trên PostgreSQL 16:

- **Bảng phình.** Nếu vacuum chạy theo lịch cố định, bảng có lượng update tăng đột biến có thể phình tới mức cần `VACUUM FULL` mới lấy lại chỗ. Autovacuum giảm vấn đề này vì nó lên lịch theo lượng update thực tế[^pg-vacuum].
- **Transaction đang mở giữ dead tuple lại**[^pg-client-config]. Lab đo cụ thể ba trường hợp:
    - Transaction Repeatable Read đang mở, chỉ đọc (`backend_xid` NULL, `backend_xmin` khác NULL): VACUUM không dọn được.
    - Transaction Read Committed đã ghi vào một bảng khác (`backend_xid` khác NULL, `backend_xmin` NULL): VACUUM vẫn không dọn được.
    - Transaction Read Committed chỉ chạy `SELECT` rồi nghỉ (`backend_xid`, `backend_xmin` đều NULL): VACUUM vẫn dọn được.
- **Autovacuum phải theo kịp việc chống wraparound.** PostgreSQL 16 cảnh báo khi còn 40 triệu transaction tới giới hạn, và từ chối cấp transaction ID mới khi còn dưới 3 triệu[^pg-vacuum]. Các ngưỡng này được nâng từ PostgreSQL 14[^pg14-release].

Đánh đổi trên Oracle (Release 26): báo cáo chạy lâu có thể gặp lỗi `snapshot too old`, khi undo cần cho việc đọc nhất quán đã bị transaction khác dùng lại. Cách tránh là đặt undo retention phù hợp[^ora-concurrency].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Để transaction mở lâu sau khi đã ghi, hoặc ở Repeatable Read.** Dấu hiệu: `VACUUM VERBOSE` báo "dead but not yet removable"; `pg_stat_activity` có phiên `idle in transaction` với `age(backend_xid)` hoặc `age(backend_xmin)` lớn[^pg-vacuum]. Cách xử lý: commit, rollback hoặc kết thúc phiên đó[^pg-vacuum]; đặt `idle_in_transaction_session_timeout`[^pg-client-config].
- **Tắt hoặc cấu hình autovacuum quá lỏng cho bảng ghi nhiều.** Dấu hiệu: kết quả của `SELECT datname, age(datfrozenxid) FROM pg_database` tăng liên tục, tiến gần ngưỡng cảnh báo[^pg-vacuum].
- **Không giám sát tuổi transaction ID.** Dấu hiệu: lần đầu biết tới vấn đề là khi database từ chối ghi.
- **Nghĩ rằng `DELETE` giải phóng dung lượng ngay.** Phiên bản cũ vẫn nằm đó tới khi được vacuum, và kể cả sau đó, file của bảng thường không nhỏ lại[^pg-vacuum].

## Ví dụ thực tế

- [ex:lab-mvcc] — trên PostgreSQL 16.15:
    - Sau `UPDATE`, dòng id 1 chuyển từ `ctid (0,1)`, `xmin 1517` sang `ctid (5,76)`, `xmin 1518`.
    - Update 1.000 dòng để lại 1.000 dead tuple; `VACUUM` dọn hết.
    - Khi một transaction Repeatable Read chỉ đọc đang mở (`backend_xmin` = 1520), hoặc một transaction Read Committed đã ghi vào bảng khác đang mở (`backend_xid` = 1523), `VACUUM` báo `1000 are dead but not yet removable`.
    - Một transaction Read Committed chỉ chạy `SELECT` rồi nghỉ thì không chặn.
- [ex:sentry-case] — ngày 20/7/2015, database Postgres của Sentry ngừng nhận ghi do transaction ID wraparound, và Sentry ngừng gần hết một ngày làm việc ở Mỹ[^sentry-wraparound].
    - Bối cảnh: Sentry ghi rất nhiều, có những bảng rất lớn, và trước đó đặt `autovacuum_freeze_max_age` quá cao.
    - Khôi phục: họ truncate một bảng lớn để hồi phục nhanh, chấp nhận mất dữ liệu bảng đó, rồi chỉnh lại autovacuum[^sentry-wraparound].
    - Bài không nêu phiên bản PostgreSQL. Sự cố xảy ra trước khi PostgreSQL 14 (phát hành 2021-09-30) nâng các ngưỡng cảnh báo[^pg14-release].
- [ex:mandrill-case] — từ 05:35 UTC ngày 4/2 tới 22:09 UTC ngày 5/2/2019, shard4 trong hệ Postgres của Mandrill gặp XID wraparound[^mandrill-outage].
    - Nguyên nhân: autovacuum trên shard4 có lẽ đã tụt lại, nhưng Mailchimp không xác định chắc là tụt lại hay lỗi hẳn.
    - Mức ảnh hưởng: ước tính cao nhất cho một lần vacuum đầy đủ là 40 ngày; trong sự cố chỉ gửi được 80% email trong hàng đợi. Sau sự cố, họ thêm cảnh báo XID wraparound[^mandrill-outage].
    - Bài cũng không nêu phiên bản; sự cố xảy ra trước PostgreSQL 14. Tài liệu PostgreSQL 16 ghi rằng ở các bản trước, đôi khi phải dừng postmaster và vacuum ở single-user mode[^pg-vacuum].

## Câu hỏi tự kiểm tra

- Trên PostgreSQL 16, sau một câu `UPDATE`, phiên bản cũ của dòng đi đâu, và điều kiện nào để VACUUM dọn được nó?
- Ba phiên đang `idle in transaction`: một ở Repeatable Read, một ở Read Committed đã ghi một dòng, một ở Read Committed chỉ chạy `SELECT`. Phiên nào giữ dead tuple lại, và bạn kiểm tra bằng cột nào của `pg_stat_activity`?
- Oracle và PostgreSQL lưu phiên bản cũ ở đâu? Mỗi cách dẫn tới lỗi vận hành nào cần giám sát?
- Trong hai sự cố Sentry và Mandrill, điều gì giống nhau về nguyên nhân? Bạn sẽ đặt cảnh báo nào để biết sớm?

## Chủ đề liên quan và nguồn kiểm chứng
