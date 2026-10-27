---
id: db-tables-keys-constraints
title: Bảng, khóa và constraint
parent: db-relational
summary: Primary key, foreign key, unique, check và vì sao để database giữ toàn vẹn dữ liệu.
contentStatus: verified
volatility: stable
verifiedAt: 2026-10-15
verifiedBy: claude
prerequisites:
  - db-schema-data-model
related:
  - db-normalization
  - db-index-basics
  - db-transaction-acid
sources:
  - id: pg-constraints
    url: https://www.postgresql.org/docs/16/ddl-constraints.html
    title: "PostgreSQL 16 — 5.4. Constraints"
    supports: "Định nghĩa check, not-null, unique, primary key, foreign key; check thỏa khi biểu thức là true hoặc null; không hỗ trợ check tham chiếu dữ liệu ngoài dòng đang kiểm, nên dùng UNIQUE, EXCLUDE, FOREIGN KEY cho ràng buộc nhiều dòng, nhiều bảng; unique và primary key tự tạo unique B-tree index; mặc định hai NULL không bằng nhau trong unique, đổi bằng NULLS NOT DISTINCT, cách xử lý NULL do từng hệ quyết định theo chuẩn SQL; các hành động ON DELETE và khác biệt NO ACTION/RESTRICT; foreign key không tự tạo index ở cột tham chiếu, xóa dòng cha phải quét bảng con; dòng có cột tham chiếu NULL mặc định không phải thỏa foreign key, khai báo NOT NULL nếu không muốn."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: pg-createtable
    url: https://www.postgresql.org/docs/16/sql-createtable.html
    title: "PostgreSQL 16 — CREATE TABLE"
    supports: "NOT DEFERRABLE là mặc định, kiểm tra ngay sau mỗi lệnh; chỉ UNIQUE, PRIMARY KEY, EXCLUDE, REFERENCES nhận DEFERRABLE, NOT NULL và CHECK không hoãn được; INITIALLY IMMEDIATE là mặc định, INITIALLY DEFERRED kiểm tra cuối transaction, đổi được bằng SET CONSTRAINTS; hành động tham chiếu khác NO ACTION không hoãn được; UNIQUE/PRIMARY KEY không hoãn được thì kiểm tra ngay khi từng dòng được chèn hoặc sửa."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: ora-integrity
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/data-integrity.html
    title: "Oracle AI Database Concepts — Data Integrity"
    supports: "Khuyên dùng constraint hoặc assertion bất cứ khi nào có thể vì dữ liệu từ mọi ứng dụng đều phải tuân theo; DML vi phạm constraint không hoãn thì câu lệnh bị rollback, constraint hoãn vi phạm lúc COMMIT thì cả transaction bị rollback; hành động tham chiếu: no action, delete cascade, delete set null, hành động khác dùng trigger; NULL luôn thỏa unique nếu không có NOT NULL; không được trùng giá trị ở các cột khác NULL của unique nhiều cột có một phần NULL; assertion là biểu thức có subquery trên các bảng, chỉ nên dùng khi constraint không làm được; constraint không hoãn được kiểm tra cuối mỗi câu lệnh; foreign key nên được đánh index trừ khi khóa cha không bao giờ bị sửa hay xóa; tạm tắt constraint khi nạp dữ liệu lớn; ví dụ ORA-02290."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-15
  - id: ora-constraint
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/constraint.html
    title: "Oracle AI Database SQL Language Reference — constraint"
    supports: "Bỏ qua mệnh đề ON DELETE thì database không cho xóa khóa ở bảng cha khi còn dòng con phụ thuộc; ON DELETE CASCADE xóa theo, ON DELETE SET NULL đổi giá trị foreign key phụ thuộc thành NULL."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-15
examples:
  - id: lab-constraints
    kind: lab-run
    title: "PostgreSQL 16.15: ghi sai bị từ chối, CHECK với NULL, CASCADE và thẻ lệnh DELETE, UNIQUE với NULL"
    path: lab/experiments/db-tables-keys-constraints
    checkedAt: 2026-10-14
  - id: ora-check-error
    kind: official-doc
    title: "Ví dụ ORA-02290 trong tài liệu Oracle"
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/data-integrity.html
    checkedAt: 2026-10-14
changelog:
  - date: 2026-10-14
    note: Claude soạn bản nháp đầu tiên và chạy thử nghiệm trên PostgreSQL 16.15.
  - date: 2026-10-14
    note: "Kiểm chứng: thêm điều kiện constraint không hoãn/hoãn, CHECK chấp nhận NULL, hành vi NULL ở unique nhiều cột của Oracle, ràng buộc nhiều dòng, hành động no action của Oracle; thêm bước CASCADE, CHECK với NULL, UNIQUE với NULL vào lab."
  - date: 2026-10-15
    note: "Phản biện vòng 2: tách DEFERRABLE khỏi INITIALLY DEFERRED, thêm ngoại lệ kiểm tra unique theo từng dòng, ngoại lệ NULL của foreign key, nguồn cho mặc định ON DELETE của Oracle, điều kiện dùng assertion; giới hạn câu 25P02 vào lab."
  - date: 2026-10-15
    note: "Phản biện vòng 3: viết lại dấu hiệu thiếu index đúng với điều lab cho thấy."
---

## Vấn đề cần giải quyết

Dữ liệu đi vào database qua nhiều đường: API, script import, công cụ quản trị, người sửa tay. Kiểm tra trong code ứng dụng chỉ bảo vệ được đường đi qua code đó.

Tài liệu Oracle AI Database (Release 26) khuyên dùng constraint để giữ toàn vẹn dữ liệu bất cứ khi nào có thể, vì dữ liệu do mọi ứng dụng ghi vào đều phải tuân theo[^ora-integrity].

## Cơ chế và luồng hoạt động

Constraint là quy tắc khai báo ở bảng. Database kiểm tra nó mỗi khi dữ liệu thay đổi.

| Constraint | Bảo đảm | Ghi chú (PostgreSQL 16) |
| --- | --- | --- |
| `NOT NULL` | Cột luôn có giá trị | |
| `UNIQUE` | Không có hai dòng trùng giá trị ở cột hoặc nhóm cột | Tự tạo unique B-tree index[^pg-constraints]; xử lý `NULL` xem dưới |
| `PRIMARY KEY` | Unique và not null, tối đa một cho mỗi bảng | Tự tạo unique B-tree index[^pg-constraints] |
| `FOREIGN KEY` | Giá trị phải khớp một dòng ở bảng được tham chiếu | Không tự tạo index ở cột tham chiếu. Dòng có một cột tham chiếu NULL mặc định không phải thỏa constraint; thêm `NOT NULL` nếu không muốn vậy[^pg-constraints] |
| `CHECK` | Biểu thức logic không được ra false | Thỏa khi biểu thức là true **hoặc null**[^pg-constraints] |

**Khi nào kiểm tra, và vi phạm thì sao.**

- Mặc định constraint là `NOT DEFERRABLE`: PostgreSQL 16 kiểm tra ngay sau mỗi lệnh. Riêng `UNIQUE` và `PRIMARY KEY` không hoãn được thì PostgreSQL kiểm tra ngay khi từng dòng được chèn hoặc sửa[^pg-createtable]. Oracle (Release 26) kiểm tra cuối mỗi câu lệnh và rollback câu lệnh vi phạm[^ora-integrity].
- Trên PostgreSQL 16, chỉ `UNIQUE`, `PRIMARY KEY`, `EXCLUDE` và foreign key nhận `DEFERRABLE`; `NOT NULL` và `CHECK` không hoãn được[^pg-createtable].
- `DEFERRABLE` chỉ cho phép hoãn. Mặc định vẫn là `INITIALLY IMMEDIATE`, tức kiểm tra sau mỗi lệnh; muốn kiểm tra ở cuối transaction phải khai báo `INITIALLY DEFERRED` hoặc dùng `SET CONSTRAINTS`. Hành động tham chiếu khác `NO ACTION`, như `CASCADE`, không hoãn được kể cả khi khai báo `DEFERRABLE`[^pg-createtable].
- Với constraint hoãn, Oracle kiểm tra lúc `COMMIT` và rollback cả transaction nếu vi phạm[^ora-integrity].
- Trong lab trên PostgreSQL 16.15, sau lỗi 23505 bên trong transaction, lệnh tiếp theo bị từ chối với 25P02 cho tới khi rollback.

**Khi dòng cha bị xóa**, foreign key xử lý theo hành động đã khai báo:

- PostgreSQL 16: `NO ACTION` (mặc định), `RESTRICT`, `CASCADE`, `SET NULL`, `SET DEFAULT`. `NO ACTION` và `RESTRICT` đều báo lỗi nếu còn dòng con. Khác biệt chính là `NO ACTION` cho phép hoãn kiểm tra tới sau trong transaction, còn `RESTRICT` thì không[^pg-constraints].
- Oracle (Release 26): nếu bỏ qua mệnh đề `ON DELETE`, database không cho xóa khóa ở bảng cha khi còn dòng con phụ thuộc. Có thể chọn `ON DELETE CASCADE` hoặc `ON DELETE SET NULL`[^ora-constraint]. Hành động khác phải dùng trigger[^ora-integrity].

## Điều kiện áp dụng, lợi ích và đánh đổi

Lợi ích: quy tắc nằm ở một chỗ, đúng với mọi đường ghi, và lỗi xuất hiện ngay lúc ghi thay vì nhiều tháng sau trong báo cáo sai.

Đánh đổi:

- Kiểm tra constraint có chi phí. Oracle cho tạm tắt constraint khi nạp lượng lớn dữ liệu để tránh chi phí đó, rồi bật lại sau[^ora-integrity].
- Mỗi foreign key là một quan hệ mà mọi thao tác xóa ở bảng cha phải tính tới (xem mục Lỗi thường gặp).

**Quy tắc nào hợp với loại constraint nào:**

- Quy tắc chỉ phụ thuộc vào chính dòng đang ghi (định dạng, khoảng giá trị, quan hệ giữa các cột) hợp với `CHECK`.
- PostgreSQL 16 không hỗ trợ `CHECK` tham chiếu dữ liệu ngoài dòng đang kiểm. Ràng buộc giữa nhiều dòng hoặc nhiều bảng nên dùng `UNIQUE`, `EXCLUDE` hoặc `FOREIGN KEY`[^pg-constraints].
- Oracle (Release 26) có thêm assertion: biểu thức logic chứa subquery trên các bảng của ứng dụng. Oracle khuyên luôn dùng constraint khi có thể, và chỉ dùng assertion khi constraint không làm được[^ora-integrity].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Quên index cho cột foreign key.** Trên PostgreSQL 16, xóa một dòng cha hoặc sửa khóa của nó phải quét bảng con tìm dòng khớp. Vì vậy tài liệu cho rằng đánh index cột tham chiếu thường là ý hay, dù không phải lúc nào cũng cần[^pg-constraints]. Oracle (Release 26) khuyên đánh index foreign key, trừ khi khóa cha không bao giờ bị sửa hay xóa[^ora-integrity]. Dấu hiệu: không có index nào trên cột foreign key; ở lab, `pg_indexes` chỉ có index của primary key và unique.
- **Tưởng `CHECK` chặn được NULL.** Cột cho phép NULL với `check (status in ('pending','approved'))` vẫn nhận NULL, vì CHECK thỏa khi biểu thức ra null[^pg-constraints]. Lab cho thấy chèn NULL thành công còn `'done'` bị 23514. Cách sửa: thêm `NOT NULL`.
- **Bất ngờ với NULL trong unique.** PostgreSQL 16 mặc định coi hai NULL là khác nhau: unique trên (a, b) vẫn nhận hai dòng `(1, NULL)`. Đổi bằng `NULLS NOT DISTINCT`[^pg-constraints]. Oracle (Release 26) xử lý unique nhiều cột khác: không được trùng giá trị ở các cột khác NULL khi một phần là NULL[^ora-integrity]. Chuẩn SQL để cách xử lý này cho từng hệ quyết định[^pg-constraints]. Dấu hiệu: dữ liệu "trùng" xuất hiện dù đã có unique, hoặc cùng dữ liệu bị từ chối khi chuyển sang Oracle.
- **Dùng `CASCADE` rồi đếm sai số dòng bị xóa.** Trên PostgreSQL 16.15, xóa 1 dòng cha trả về `DELETE 1`, trong khi 50 dòng con cũng biến mất (lab). Dấu hiệu: bảng con mất dữ liệu mà log ứng dụng chỉ ghi "đã xóa 1 dòng".
- **Chỉ kiểm tra ở ứng dụng.** Dấu hiệu: script import hoặc sửa tay tạo ra dữ liệu mồ côi.

## Ví dụ thực tế

- [ex:lab-constraints] — trên PostgreSQL 16.15:
    - Năm lần ghi sai đều bị từ chối: người gửi không tồn tại (23503), trạng thái `'done'` (23514), email trùng (23505), thiếu người gửi (23502), xóa phòng ban còn nhân viên với `on delete restrict` (23503).
    - `pg_indexes` chỉ có index của primary key và unique; hai cột foreign key không có index.
    - Các bước bổ sung: CHECK nhận NULL; `CASCADE` trả `DELETE 1` dù xóa theo 50 dòng con; unique mặc định nhận hai dòng `(1, NULL)` còn `NULLS NOT DISTINCT` thì từ chối; lỗi 23505 trong transaction khiến lệnh sau bị 25P02.
- [ex:ora-check-error] — tài liệu Oracle minh họa lệnh `INSERT` vi phạm check constraint `salary < 10001` và nhận lỗi `ORA-02290`[^ora-integrity].

## Câu hỏi tự kiểm tra

- Vì sao kiểm tra ở ứng dụng không thay được foreign key? Nêu một đường ghi dữ liệu mà kiểm tra ở ứng dụng bỏ sót.
- Bảng `requests` có foreign key `requester_id` tới `users`. Khi xóa một user, PostgreSQL 16 phải làm gì với `requests`, và thiếu index ở `requester_id` thì việc đó tốn thế nào?
- Cột `status` có `CHECK (status in ('pending','approved'))` nhưng vẫn có dòng NULL. Vì sao, và sửa thế nào?
- Quan hệ giữa yêu cầu và bình luận nên dùng `NO ACTION`, `RESTRICT` hay `CASCADE`? Lập luận theo điều gì sẽ xảy ra với dữ liệu và với con số `DELETE n` mà ứng dụng ghi log.

## Chủ đề liên quan và nguồn kiểm chứng
