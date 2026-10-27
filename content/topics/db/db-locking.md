---
id: db-locking
title: Locking và deadlock
parent: db-relational
summary: Khóa dòng, khóa bảng, chờ khóa và deadlock.
contentStatus: verified
volatility: slow
verifiedAt: 2026-10-15
verifiedBy: claude
prerequisites:
  - db-transaction-acid
related:
  - db-mvcc
  - db-isolation-levels
  - db-schema-migration
  - db-transaction-boundary
sources:
  - id: pg-locking
    url: https://www.postgresql.org/docs/16/explicit-locking.html
    title: "PostgreSQL 16 — 13.3. Explicit Locking"
    supports: "SELECT lấy ACCESS SHARE, chỉ xung đột với ACCESS EXCLUSIVE; chỉ ACCESS EXCLUSIVE chặn SELECT thường; khóa dòng không ảnh hưởng việc đọc, chỉ chặn người ghi và người khóa cùng dòng, giải phóng khi transaction kết thúc; FOR UPDATE ngăn transaction khác khóa, sửa, xóa các dòng đó tới khi transaction hiện tại kết thúc; PostgreSQL tự phát hiện deadlock và hủy một transaction, không đoán trước được transaction nào; nên khóa theo thứ tự nhất quán, hoặc retry transaction bị hủy do deadlock; ROW EXCLUSIVE do UPDATE, DELETE, INSERT, MERGE lấy; SHARE ROW EXCLUSIVE xung đột với ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: pg-iso
    url: https://www.postgresql.org/docs/16/transaction-iso.html
    title: "PostgreSQL 16 — 13.2. Transaction Isolation"
    supports: "Ở Read Committed, người cập nhật thứ hai chờ người đầu commit hoặc rollback, rồi đánh giá lại WHERE trên phiên bản mới và cập nhật trên phiên bản đó; ở Repeatable Read, nếu người đầu đã sửa và commit thì transaction bị hủy với could not serialize access due to concurrent update và phải chạy lại cả transaction."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg-altertable
    url: https://www.postgresql.org/docs/16/sql-altertable.html
    title: "PostgreSQL 16 — ALTER TABLE"
    supports: "ALTER TABLE lấy ACCESS EXCLUSIVE trừ khi ghi chú khác; mức khóa có thể khác nhau theo từng dạng lệnh; ADD FOREIGN KEY chỉ cần SHARE ROW EXCLUSIVE trên bảng có constraint và trên bảng được tham chiếu; quét bảng lớn để kiểm tra foreign key mới chặn các update khác tới khi ALTER TABLE ADD CONSTRAINT commit; NOT VALID bỏ qua bước quét và commit ngay; VALIDATE CONSTRAINT chỉ lấy SHARE UPDATE EXCLUSIVE (thêm ROW SHARE trên bảng được tham chiếu nếu là foreign key)."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: pg-client-config
    url: https://www.postgresql.org/docs/16/runtime-config-client.html
    title: "PostgreSQL 16 — 20.11. Client Connection Defaults"
    supports: "lock_timeout hủy câu lệnh chờ khóa lâu hơn thời gian đặt, áp dụng riêng cho từng lần xin khóa; không nên đặt trong postgresql.conf vì ảnh hưởng mọi phiên; idle_in_transaction_session_timeout giúp phiên nghỉ không giữ khóa quá lâu."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: pg-monitoring
    url: https://www.postgresql.org/docs/16/monitoring-stats.html
    title: "PostgreSQL 16 — 28.2. The Cumulative Statistics System"
    supports: "Trạng thái idle in transaction: backend đang ở trong transaction nhưng không chạy truy vấn nào; wait event transactionid (loại Lock): chờ một transaction kết thúc."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: ora-concurrency
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/data-concurrency-and-consistency.html
    title: "Oracle AI Database Concepts — Data Concurrency and Consistency"
    supports: "Người ghi một dòng chặn người ghi khác cùng dòng; Oracle không bao giờ nâng khóa (lock escalation làm tăng khả năng deadlock); tự phát hiện deadlock và rollback một câu lệnh, báo ORA-00060; thường transaction nhận lỗi nên được rollback tường minh, hoặc có thể chạy lại câu lệnh bị rollback sau khi chờ."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-14
  - id: rails-locking
    url: https://guides.rubyonrails.org/active_record_querying.html
    title: "Rails Guides 8.1.4 — Active Record Query Interface, Locking Records for Update"
    supports: "Optimistic locking cho nhiều người cùng mở một bản ghi để sửa, kiểm tra bản ghi có bị tiến trình khác đổi từ lúc mở không; cần cột lock_version; nếu có thì ném ActiveRecord::StaleObjectError và bỏ lần cập nhật; pessimistic locking dùng cơ chế khóa của database, lấy khóa độc quyền trên các dòng được chọn."
    product: Ruby on Rails
    version: "8.1.4"
    checkedAt: 2026-10-15
  - id: gocardless-locks
    url: https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts/
    title: "GoCardless — Zero-downtime Postgres migrations: the hard parts (sửa lần cuối 6/2024)"
    supports: "Migration tạo lại foreign key; theo bài, Postgres lấy AccessExclusive trên cả hai bảng khi thêm foreign key; các khóa xung đột với khóa đang xếp hàng sẽ xếp hàng sau nó; khoảng 15 giây API ngừng phục vụ ngoài dự kiến; khuyên đặt lock_timeout trong script migration và loại bỏ truy vấn, transaction chạy lâu; bài không nêu phiên bản PostgreSQL của sự cố, chỉ nhắc tới 9.4."
    product: PostgreSQL
    checkedAt: 2026-10-14
  - id: pg-locks-config
    url: https://www.postgresql.org/docs/16/runtime-config-locks.html
    title: "PostgreSQL 16 — 20.12. Lock Management (deadlock_timeout)"
    supports: "deadlock_timeout là thời gian chờ khóa trước khi kiểm tra xem có deadlock không; bước kiểm tra tốn kém nên không chạy mỗi lần chờ khóa; mặc định 1s."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
examples:
  - id: lab-locking
    kind: lab-run
    title: "Lost update, FOR UPDATE, update nguyên tử, deadlock và hàng đợi khóa trên PostgreSQL 16.15"
    path: lab/experiments/db-locking
    checkedAt: 2026-10-14
  - id: gocardless-case
    kind: public-case
    title: "GoCardless: migration chờ khóa làm API ngừng khoảng 15 giây"
    url: https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts/
    checkedAt: 2026-10-14
changelog:
  - date: 2026-10-14
    note: Claude soạn bản nháp đầu tiên và chạy thử nghiệm trên PostgreSQL 16.15.
  - date: 2026-10-14
    note: "Kiểm chứng: ghi rõ case GoCardless thuộc phiên bản cũ và PostgreSQL 16 dùng khóa nhẹ hơn cho ADD FOREIGN KEY; giới hạn hàng đợi khóa vào ALTER TABLE cần ACCESS EXCLUSIVE; thêm điều kiện isolation cho update nguyên tử và đo trong lab; thêm nguồn cho optimistic locking, retry deadlock, cách Oracle xử lý; nói rõ thời gian chờ trong lab do script điều khiển."
  - date: 2026-10-15
    note: "Phản biện vòng 2: nêu rõ ADD FOREIGN KEY trên PostgreSQL 16 vẫn chặn ghi, thêm cách NOT VALID rồi VALIDATE CONSTRAINT, dẫn nguồn cơ chế deadlock_timeout; mở lại hướng dẫn Rails 8.1.4 và trang pg_stat_activity để xác nhận."
  - date: 2026-10-15
    note: "Phản biện vòng 3: thêm khóa ROW SHARE trên bảng được tham chiếu khi VALIDATE CONSTRAINT, ghi rõ khuyến nghị lock_timeout là của bài và lý do, gộp mô tả nguồn."
---

## Vấn đề cần giải quyết

MVCC giúp đọc và ghi không chặn nhau, nhưng **hai người cùng ghi một dòng** vẫn phải được xếp thứ tự[^ora-concurrency][^pg-iso]. Đổi cấu trúc bảng khi bảng đang được dùng cũng cần độc quyền. Database dùng khóa cho các trường hợp này.

Hiểu khóa giúp tránh ba loại sự cố: mất cập nhật (lost update), deadlock, và cả hệ thống đứng vì một câu lệnh đang chờ khóa.

## Cơ chế và luồng hoạt động

**Khóa dòng (PostgreSQL 16).** `UPDATE`, `DELETE` và `SELECT ... FOR UPDATE` khóa các dòng chúng chạm tới cho tới khi transaction kết thúc. Transaction khác muốn sửa hoặc khóa cùng dòng phải chờ, còn truy vấn đọc thường thì không bị ảnh hưởng[^pg-locking]. Oracle (Release 26) cũng cho người ghi một dòng chặn người ghi khác cùng dòng, và không bao giờ nâng khóa dòng lên mức cao hơn[^ora-concurrency].

**Khóa bảng (PostgreSQL 16).** Mỗi câu lệnh lấy một mức khóa trên bảng:

- `SELECT` thường lấy `ACCESS SHARE`, chỉ xung đột với `ACCESS EXCLUSIVE`. Vì vậy chỉ `ACCESS EXCLUSIVE` chặn được `SELECT` thường[^pg-locking].
- `ALTER TABLE` lấy `ACCESS EXCLUSIVE` trừ khi ghi chú khác, và mức khóa khác nhau theo từng dạng lệnh. Ví dụ `ADD FOREIGN KEY` chỉ cần `SHARE ROW EXCLUSIVE` trên cả hai bảng[^pg-altertable].

**Hàng đợi khóa.** Khóa không lấy được thì phải chờ. GoCardless mô tả: các khóa xung đột với một khóa đang xếp hàng sẽ xếp hàng sau nó[^gocardless-locks]. Lab trên PostgreSQL 16.15 cho thấy đúng điều đó:

1. A giữ `AccessShareLock` (một transaction đọc chưa commit).
2. `ALTER TABLE ... ADD COLUMN` của B chờ `AccessExclusiveLock`.
3. `SELECT` của C, vốn không xung đột với A, cũng phải chờ sau B.

**Deadlock.** A giữ X chờ Y, B giữ Y chờ X. PostgreSQL 16 tự phát hiện và hủy một transaction; không đoán trước được là transaction nào[^pg-locking]. Oracle (Release 26) phát hiện và rollback một câu lệnh, báo `ORA-00060`. Thường thì transaction nhận lỗi nên được rollback tường minh[^ora-concurrency].

## Điều kiện áp dụng, lợi ích và đánh đổi

Cần "đọc rồi ghi dựa trên giá trị vừa đọc" thì có ba cách. Mỗi cách có điều kiện riêng:

| Cách | Điều kiện để đúng | Đổi lại |
| --- | --- | --- |
| Phép tính trong câu `UPDATE` (`approvals = approvals + 1`) | Read Committed trên PostgreSQL 16: người sau chờ rồi tính trên phiên bản mới[^pg-iso]. Ở Repeatable Read thì nhận `40001`, phải chạy lại transaction[^pg-iso] (lab bước 2b, 2c) | Chỉ dùng được khi phép tính viết được bằng SQL |
| `SELECT ... FOR UPDATE` rồi ghi | Khóa đúng mọi dòng mà quyết định dựa vào[^pg-locking] | Người sau chờ suốt transaction của người trước |
| Optimistic locking (cột version) | Mọi đường ghi đều kiểm tra version. Rails 8.1.4 dùng cột `lock_version` và ném `StaleObjectError`, bỏ lần cập nhật khi bản ghi đã bị đổi[^rails-locking] | Không chờ, nhưng ứng dụng phải xử lý lần ghi bị từ chối |

Khóa giữ tới khi transaction kết thúc[^pg-locking], nên transaction càng dài thì càng nhiều người chờ. Giữ transaction ngắn.

Đổi schema trên bảng đang dùng: đặt `lock_timeout` để câu lệnh bỏ cuộc thay vì treo vô hạn[^pg-client-config][^gocardless-locks]. Hai điểm cần biết khi dùng nó:

- Các truy vấn đến sau vẫn phải chờ trong khoảng `lock_timeout` đó (lab bước 5).
- Tài liệu PostgreSQL 16 khuyên không đặt `lock_timeout` trong `postgresql.conf`, vì nó ảnh hưởng mọi phiên[^pg-client-config].

Thêm foreign key vào bảng đang được ghi trên PostgreSQL 16 cần cẩn thận riêng. `ADD FOREIGN KEY` lấy `SHARE ROW EXCLUSIVE` trên cả hai bảng[^pg-altertable]. Khóa này xung đột với `ROW EXCLUSIVE`, khóa mà `INSERT`, `UPDATE`, `DELETE` lấy[^pg-locking], và việc quét bảng để kiểm tra foreign key chặn các update khác tới khi lệnh commit[^pg-altertable]. Cách giảm tác động mà tài liệu đưa ra: thêm constraint với `NOT VALID` (không quét, commit ngay), rồi chạy `VALIDATE CONSTRAINT` riêng, bước này lấy `SHARE UPDATE EXCLUSIVE` trên bảng đang sửa, và thêm `ROW SHARE` trên bảng được tham chiếu nếu là foreign key, nên không chặn update đồng thời[^pg-altertable]. Khuyến nghị của bài: đặt `lock_timeout` cho cả hai bước, vì bước `NOT VALID` vẫn cần `SHARE ROW EXCLUSIVE` trên cả hai bảng[^pg-altertable] nên vẫn có thể phải xếp hàng chờ như lab bước 5.

## Lỗi thường gặp và dấu hiệu nhận biết

- **Lost update.** Hai phiên đọc cùng giá trị, tính ở ứng dụng, rồi ghi đè lên nhau. Dấu hiệu: số đếm, số dư hoặc trạng thái "mất" một lần thay đổi mà không có lỗi nào.
- **Khóa nhiều dòng theo thứ tự khác nhau.** Dấu hiệu: lỗi deadlock thỉnh thoảng xuất hiện dưới tải. Cách phòng là mọi đường code khóa các đối tượng theo cùng thứ tự. Nếu không bảo đảm được thì retry transaction bị hủy do deadlock[^pg-locking].
- **Migration chặn cả hệ thống.** Dấu hiệu: đúng lúc chạy migration, nhiều request treo với `wait_event_type = Lock`.
- **Transaction quên đóng.** Một phiên giữ khóa rồi bỏ đó. Dấu hiệu: `pg_stat_activity` có phiên ở trạng thái `idle in transaction`, tức đang trong transaction mà không chạy truy vấn nào[^pg-monitoring]. Có thể đặt `idle_in_transaction_session_timeout` để chặn[^pg-client-config].

## Ví dụ thực tế

- [ex:lab-locking] — trên PostgreSQL 16.15, Read Committed. Các khoảng chờ 1 giây và 1,5 giây do script cho A giữ khóa; riêng 1 giây của deadlock là `deadlock_timeout`: PostgreSQL chờ khóa đủ khoảng này rồi mới chạy bước kiểm tra deadlock, mặc định `1s`[^pg-locks-config].
    - Lost update (mỗi lệnh tự commit): hai phiên cùng đọc `approvals = 0`, cùng ghi 1; kết quả còn 1 thay vì 2.
    - `SELECT ... FOR UPDATE`: B chờ (`wait_event = transactionid`, tức chờ một transaction kết thúc[^pg-monitoring]) tới khi A commit; kết quả đủ 2.
    - `approvals = approvals + 1` từ hai phiên đồng thời: kết quả 2. Khi B chạy ở Repeatable Read: B nhận `40001`, giá trị là 1.
    - Deadlock: A nhận `40P01 deadlock detected`, câu lệnh của B chạy tiếp.
    - Hàng đợi khóa: `SELECT` của C chờ sau `ALTER TABLE` của B. Với `lock_timeout = '500ms'`, `ALTER TABLE` bỏ cuộc (`55P03`), và `SELECT` gửi trong lúc đó chờ khoảng 400 ms.
- [ex:gocardless-case] — một migration của GoCardless tạo lại foreign key và làm API ngừng khoảng 15 giây ngoài dự kiến[^gocardless-locks].
    - Theo bài, thêm foreign key lấy `AccessExclusive` trên cả hai bảng, và các truy vấn từ API xếp hàng sau nó.
    - Bài không nêu phiên bản PostgreSQL của sự cố, chỉ nhắc tới 9.4. Trên PostgreSQL 16, `ADD FOREIGN KEY` chỉ cần `SHARE ROW EXCLUSIVE`[^pg-altertable]. Khóa này không xung đột với `ACCESS SHARE` của `SELECT`[^pg-locking], nên một `SELECT` dài không còn chặn nó như trong bài. Nhưng nó vẫn xung đột với `ROW EXCLUSIVE` của `INSERT`, `UPDATE`, `DELETE`[^pg-locking], nên lưu lượng ghi của API vẫn có thể xếp hàng (xem cách dùng `NOT VALID` ở trên).
    - Bài học về hàng đợi khóa và `lock_timeout` vẫn đúng với mọi lệnh cần khóa mạnh.

## Câu hỏi tự kiểm tra

- Hai quản lý cùng tăng số lượt duyệt của một yêu cầu. Viết câu lệnh để không mất lượt nào mà không cần `SELECT ... FOR UPDATE`. Câu lệnh đó còn đúng không nếu transaction chạy ở Repeatable Read?
- Vì sao một câu `ALTER TABLE ... ADD COLUMN` **chưa lấy được khóa** vẫn làm các `SELECT` khác bị treo? `lock_timeout` giới hạn thiệt hại đó tới đâu?
- Deadlock xảy ra khi nào? Nêu một cách thiết kế code để tránh, và ứng dụng nên làm gì khi nhận `40P01` trên PostgreSQL hoặc `ORA-00060` trên Oracle.
- Khi nào chọn optimistic locking thay vì `SELECT ... FOR UPDATE` cho màn hình sửa yêu cầu mà người dùng có thể mở hàng phút?

## Chủ đề liên quan và nguồn kiểm chứng
