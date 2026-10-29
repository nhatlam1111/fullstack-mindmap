---
id: db-schema-data-model
title: Schema và data model
parent: db-foundations
summary: Data model là cách tổ chức dữ liệu; schema là mô tả cụ thể cấu trúc đó trong một database.
contentStatus: verified
verifiedAt: 2026-10-15
verifiedBy: claude
volatility: stable
prerequisites:
  - db-database-dbms
related:
  - db-tables-keys-constraints
  - db-normalization
  - db-sql-nosql-terms
sources:
  - id: mongo-modeling
    url: https://www.mongodb.com/docs/manual/data-modeling/
    title: "MongoDB Manual — Data Modeling (đường dẫn /manual/ theo bản hiện hành; 9.0 khi đối chiếu)"
    supports: "Data modeling là cách tổ chức dữ liệu trong database và liên kết giữa các thực thể liên quan; MongoDB có data model linh hoạt, cho lưu dữ liệu đa hình: document trong một collection không cần cùng tập trường, kiểu của một trường có thể khác nhau giữa các document; quan hệ mô hình hóa bằng nhúng hoặc tham chiếu; nguyên tắc cốt lõi: dữ liệu được truy cập cùng nhau thì lưu cùng nhau, cấu trúc data model theo mẫu truy cập của ứng dụng."
    product: MongoDB
    version: "9.0"
    checkedAt: 2026-10-15
  - id: mongo-validation
    url: https://www.mongodb.com/docs/manual/core/schema-validation/
    title: "MongoDB Manual — Schema Validation (đường dẫn /manual/ theo bản hiện hành; 9.0 khi đối chiếu)"
    supports: "MongoDB dùng flexible schema, mặc định document trong một collection không cần cùng trường hay kiểu; schema validation cho đặt quy tắc như kiểu dữ liệu và khoảng giá trị; hữu ích nhất với ứng dụng đã có cấu trúc dữ liệu xác định, để chặn thay đổi schema ngoài ý muốn và lỗi kiểu dữ liệu; mặc định từ chối insert hoặc update tạo ra document không hợp lệ, hoặc có thể cấu hình cho phép và ghi cảnh báo."
    product: MongoDB
    version: "9.0"
    checkedAt: 2026-10-15
  - id: ora-intro
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/introduction-to-oracle-database.html
    title: "Oracle AI Database Concepts — Introduction to Oracle AI Database"
    supports: "Mô hình quan hệ của E. F. Codd: dữ liệu nằm trong các quan hệ, thể hiện thành bảng gồm các dòng."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-15
  - id: pg-schemas
    url: https://www.postgresql.org/docs/16/ddl-schemas.html
    title: "PostgreSQL 16 — 5.9. Schemas"
    supports: "Database chứa một hoặc nhiều schema có tên, schema chứa bảng và đối tượng khác như kiểu dữ liệu, hàm, toán tử; cùng tên đối tượng dùng được ở các schema khác nhau; lý do dùng schema: nhiều người dùng một database không ảnh hưởng nhau, gom đối tượng thành nhóm logic, tách ứng dụng bên thứ ba; tên không kèm schema được tìm theo search_path, bảng khớp đầu tiên được dùng, không khớp thì báo lỗi dù schema khác có bảng cùng tên; mặc định \"$user\", public, mục $user bị bỏ qua nếu không có schema cùng tên; schema đầu tiên tồn tại trên search_path là nơi tạo bảng mới khi CREATE TABLE không ghi schema; thêm một schema vào search_path là tin mọi user có quyền CREATE trên schema đó; trong chuẩn SQL, ở hệ chỉ hỗ trợ schema cơ bản, schema và user gần như tương đương; chuẩn SQL không có schema public. Tên schema bắt đầu bằng pg_ dành cho hệ thống, user không tạo được; database nâng cấp từ PostgreSQL 14 trở về trước thì mọi người có quyền CREATE trên public, từ PostgreSQL 15 cấu hình mặc định hỗ trợ mô hình không schema nào cho mọi người quyền CREATE; tên đầy đủ schema.table dùng được ở mọi chỗ cần tên bảng."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: ora-schema
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/tables-and-table-clusters.html
    title: "Oracle AI Database Concepts — Tables and Table Clusters"
    supports: "Schema là vùng chứa logic cho các cấu trúc dữ liệu gọi là schema object, như bảng và index; mỗi user account sở hữu đúng một schema cùng tên với user; ví dụ user hr sở hữu schema hr chứa bảng employees, tham chiếu là hr.employees; trong database production, chủ schema thường đại diện một ứng dụng chứ không phải một người; user account, role, context không nằm trong schema."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-15
examples:
  - id: lab-search-path
    kind: lab-run
    title: "Hai bảng requests cùng tên ở hai schema, search_path quyết định câu lệnh dùng bảng nào (PostgreSQL 16.15)"
    path: lab/experiments/db-schema-data-model
    checkedAt: 2026-10-15
  - id: ora-hr-schema
    kind: official-doc
    title: "Oracle: user hr sở hữu schema hr chứa bảng employees"
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/tables-and-table-clusters.html
    checkedAt: 2026-10-15
  - id: mongo-polymorphic
    kind: official-doc
    title: "MongoDB 9.0: document trong một collection không cần cùng tập trường"
    url: https://www.mongodb.com/docs/manual/data-modeling/
    checkedAt: 2026-10-15
changelog:
  - date: 2026-10-15
    note: "Claude soạn bài từ tài liệu PostgreSQL 16, Oracle AI Database Release 26, MongoDB 9.0 và chạy thử nghiệm search_path trên PostgreSQL 16.15."
  - date: 2026-10-15
    note: "Phản biện: nêu quyền CREATE trên public từ PostgreSQL 15 và thêm bước lab với role thường, thêm ngoại lệ tên pg_, ghi rõ định nghĩa data modeling là của MongoDB và các nhận định về schema quan hệ là cách bài này nhìn, mô tả đúng điều lab quan sát được về tên đầy đủ."
  - date: 2026-10-15
    note: "Kiểm chứng: qua phản biện độc lập, đã xử lý mọi phát hiện; chuyển sang Đã kiểm chứng."
  - date: 2026-10-29
    note: "Bỏ chỗ nhắc bài thực hành cũ; nhận định, nguồn và ví dụ không đổi."
---

## Vấn đề cần giải quyết

Hai chữ "data model" và "schema" xuất hiện ở mọi tài liệu database, nhưng mỗi sản phẩm dùng "schema" theo một nghĩa riêng. Hiểu sai nghĩa dẫn tới những lỗi cụ thể: chuyển script từ Oracle sang PostgreSQL mà bảng rơi vào schema không mong muốn, hoặc nghe "MongoDB không cần schema" rồi bỏ qua bước thiết kế dữ liệu.

## Cơ chế và luồng hoạt động

Tài liệu MongoDB 9.0 định nghĩa data modeling là việc tổ chức dữ liệu trong database và liên kết giữa các thực thể liên quan[^mongo-modeling]. Bài này dùng chữ **data model** cho kết quả của việc đó, ở mọi loại database:

- Mô hình quan hệ của E. F. Codd đặt dữ liệu trong các quan hệ, thể hiện thành bảng gồm các dòng[^ora-intro].
- Mô hình document của MongoDB lưu document; quan hệ giữa các thực thể được biểu diễn bằng nhúng hoặc tham chiếu[^mongo-modeling].

**Schema**, theo nghĩa bài này dùng, là mô tả cụ thể cấu trúc dữ liệu theo một data model: có những bảng hay collection nào, mỗi cái có trường gì, kiểu gì, ràng buộc gì. Nhưng trong tài liệu sản phẩm, chữ "schema" thường chỉ một đối tượng cụ thể:

| Sản phẩm | "Schema" là | Quan hệ với user |
| --- | --- | --- |
| PostgreSQL 16 | Không gian tên có tên trong một database, chứa bảng và đối tượng khác như kiểu dữ liệu, hàm, toán tử. Cùng tên bảng dùng được ở hai schema khác nhau[^pg-schemas] | Tách rời; tên schema không được bắt đầu bằng `pg_`, tiền tố dành cho hệ thống[^pg-schemas] |
| Oracle AI Database (Release 26) | Vùng chứa logic cho schema object, như bảng và index[^ora-schema] | Mỗi user account sở hữu đúng một schema cùng tên; chủ schema trong production thường đại diện một ứng dụng[^ora-schema] |
| MongoDB 9.0 | Cấu trúc của document; mặc định linh hoạt, document trong một collection không cần cùng trường hay kiểu[^mongo-validation] | — |

Tài liệu PostgreSQL tự ghi chú khác biệt này: trong chuẩn SQL, ở hệ chỉ hỗ trợ schema cơ bản, schema và user gần như tương đương. Tạo cho mỗi user một schema cùng tên thì PostgreSQL hành xử giống vậy[^pg-schemas].

**Câu lệnh tìm bảng thế nào trên PostgreSQL 16.** Tên không kèm schema được tìm theo `search_path`, một danh sách schema. Bảng khớp đầu tiên được dùng; nếu không có, câu lệnh báo lỗi dù schema khác có bảng cùng tên[^pg-schemas]. Mặc định `search_path` là `"$user", public`, và mục `$user` bị bỏ qua nếu không có schema trùng tên user. Schema đầu tiên tồn tại trên `search_path` cũng là nơi tạo bảng mới khi `CREATE TABLE` không ghi tên schema[^pg-schemas].

## Điều kiện áp dụng, lợi ích và đánh đổi

**Schema khai báo chặt**, theo cách bài này gọi, là khi cấu trúc được khai báo trước và database kiểm tra lúc ghi: bảng quan hệ có constraint (xem bài Bảng, khóa và constraint), hoặc MongoDB có bật schema validation. Khi đã có quy tắc validation, MongoDB 9.0 mặc định từ chối insert hoặc update tạo ra document không hợp lệ; cũng có thể cấu hình để cho phép và chỉ ghi cảnh báo[^mongo-validation]. Đánh đổi mà bài này nhấn mạnh: thay đổi cấu trúc cần được quản lý như một bước riêng (xem bài Schema migration).

**Schema linh hoạt** của MongoDB cho lưu dữ liệu đa hình: các document trong một collection có thể khác trường, và một trường có thể khác kiểu giữa các document[^mongo-modeling]. MongoDB khuyên dùng schema validation khi ứng dụng đã có cấu trúc dữ liệu xác định, để chặn thay đổi schema ngoài ý muốn và lỗi kiểu dữ liệu[^mongo-validation].

**Thiết kế theo cách đọc dữ liệu.** Nguyên tắc cốt lõi mà MongoDB nêu: dữ liệu được truy cập cùng nhau thì lưu cùng nhau, và cấu trúc data model theo mẫu truy cập của ứng dụng[^mongo-modeling]. Với mô hình quan hệ, cách tổ chức bảng được bàn ở bài Normalization.

**Schema của PostgreSQL dùng để làm gì.** Tài liệu nêu ba lý do: cho nhiều người dùng chung một database mà không ảnh hưởng nhau, gom đối tượng thành nhóm logic, và đặt ứng dụng bên thứ ba vào schema riêng để không trùng tên[^pg-schemas]. Đánh đổi là câu lệnh không ghi tên schema phụ thuộc vào `search_path` của phiên. Khuyến nghị của bài này (không trích từ nguồn): trong migration và code ứng dụng, ghi đầy đủ `schema.bảng`, hoặc đặt `search_path` tường minh cho role của ứng dụng.

## Lỗi thường gặp và dấu hiệu nhận biết

- **Mang nghĩa "schema" của Oracle sang PostgreSQL.** Trên Oracle, mỗi user có sẵn schema cùng tên[^ora-schema]. Trên PostgreSQL 16, nếu không có schema trùng tên user, mục `$user` bị bỏ qua và `CREATE TABLE` không ghi schema nhắm vào schema đầu tiên tồn tại trên `search_path`, thường là `public`[^pg-schemas]. Kết quả tùy quyền của role chạy lệnh:
    - Từ PostgreSQL 15, cấu hình mặc định không cho mọi người quyền `CREATE` trên `public`[^pg-schemas]. Role thường nhận lỗi; lab cho thấy `42501: permission denied for schema public`.
    - Chủ database, superuser, role được cấp `CREATE`, hoặc mọi role trên database nâng cấp từ PostgreSQL 14 trở về trước (nơi mọi người vẫn có quyền `CREATE` trên `public`[^pg-schemas]) thì tạo được bảng, và bảng nằm ở `public`.

    Dấu hiệu: lỗi `42501` khi chạy migration bằng role của ứng dụng, hoặc bảng nằm ở `public` thay vì schema đã định.
- **Phụ thuộc ngầm vào `search_path`.** Dấu hiệu: lỗi `42P01: relation "requests" does not exist` dù bảng có thật ở schema khác, hoặc cùng câu lệnh trả về dữ liệu của bảng khác khi đổi `search_path` (lab).
- **Thêm schema vào `search_path` mà không xét quyền.** Tài liệu PostgreSQL 16 lưu ý rằng thêm một schema vào `search_path` đồng nghĩa với tin mọi user có quyền `CREATE` trên schema đó[^pg-schemas]. Dấu hiệu: role khác có quyền tạo đối tượng trong một schema nằm trên `search_path` của ứng dụng.
- **Hiểu "flexible schema" là không cần thiết kế dữ liệu.** MongoDB vẫn có data modeling, với nguyên tắc thiết kế theo mẫu truy cập[^mongo-modeling]. Dấu hiệu: cùng một trường mang nhiều kiểu trong một collection mà code đọc dữ liệu không xử lý các trường hợp đó.

## Ví dụ thực tế

- [ex:lab-search-path] — trên PostgreSQL 16.15, hai schema `exp_hr` và `exp_it` cùng có bảng `requests` với cấu trúc khác nhau:
    - `search_path` mặc định là `"$user", public`, và `select * from requests` báo `42P01: relation "requests" does not exist`.
    - Với `search_path = exp_hr, public`, câu lệnh trả về bảng 2 cột của `exp_hr`. Với `search_path = exp_it, exp_hr, public`, cùng câu lệnh trả về bảng 3 cột của `exp_it`.
    - Với `search_path = exp_it, exp_hr, public`, tên đầy đủ `exp_hr.requests` vẫn trả về bảng của `exp_hr`. Tài liệu ghi tên đầy đủ `schema.table` dùng được ở mọi chỗ cần tên bảng[^pg-schemas]. `information_schema.columns` liệt kê cấu trúc của cả hai bảng.
    - Role thường `lab_schema_user`, không có quyền `CREATE` trên `public`, chạy `create table new_requests (id integer)` không ghi schema và nhận `42501: permission denied for schema public`.
- [ex:ora-hr-schema] — tài liệu Oracle AI Database (Release 26): user account `hr` sở hữu schema `hr`, trong đó có bảng `employees`, tham chiếu bằng `hr.employees`[^ora-schema].
- [ex:mongo-polymorphic] — tài liệu MongoDB 9.0: document trong một collection không cần cùng tập trường, và kiểu của một trường có thể khác nhau giữa các document[^mongo-modeling].

## Câu hỏi tự kiểm tra

- Chọn một ứng dụng bạn đang làm: data model của nó là gì, và schema cụ thể gồm những gì?
- Trên PostgreSQL 16, câu `select * from requests` dùng bảng nào? Điều gì quyết định, và khi nào câu lệnh báo `42P01` dù bảng tên đó có tồn tại?
- Cùng chữ "schema", Oracle và PostgreSQL chỉ hai thứ khác nhau thế nào? Khi chuyển script tạo bảng không ghi schema từ Oracle sang PostgreSQL 16, câu `CREATE TABLE` có thể cho những kết quả nào, tùy role chạy nó?
- "Flexible schema" của MongoDB 9.0 cho phép gì? Khi nào MongoDB khuyên bật schema validation, và khi đó insert sai cấu trúc bị xử lý thế nào theo mặc định?

## Chủ đề liên quan và nguồn kiểm chứng
