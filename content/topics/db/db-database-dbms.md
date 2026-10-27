---
id: db-database-dbms
title: Database, DBMS và RDBMS
parent: db-foundations
summary: Phân biệt dữ liệu, hệ quản trị database và hệ quản trị database quan hệ.
contentStatus: verified
volatility: stable
verifiedAt: 2026-10-15
verifiedBy: claude
prerequisites: []
related:
  - db-sql-nosql-terms
  - db-transaction-acid
  - db-n-plus-one
sources:
  - id: ora-intro
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/introduction-to-oracle-database.html
    title: "Oracle AI Database Concepts — Introduction to Oracle AI Database"
    supports: "Định nghĩa database, DBMS; mô hình quan hệ của Codd; SQL khai báo, theo tập hợp; RDBMS quyết định cách làm và thực hiện, có thể dùng index, đọc dữ liệu vào bộ nhớ; thao tác atomic cập nhật nhiều file mà hỏng giữa chừng thì các file không nhất quán; khóa là cơ chế ngăn transaction phá hỏng thao tác của nhau trên tài nguyên chung; Oracle AI Database dùng khóa để kiểm soát truy cập đồng thời; transaction là đơn vị công việc atomic; thao tác vật lý trong suốt với ứng dụng; từ 21c, database chỉ các data file của CDB, PDB hoặc application container."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-15
  - id: ora-nulls
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Nulls.html
    title: "Oracle AI Database SQL Language Reference — Nulls"
    supports: "Oracle hiện coi giá trị ký tự độ dài 0 là null; điều này có thể không còn đúng ở bản sau và Oracle khuyên không coi chuỗi rỗng như null."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-14
  - id: pg-about
    url: https://www.postgresql.org/about/
    title: "PostgreSQL — About"
    supports: "PostgreSQL là hệ database object-relational mã nguồn mở, dùng và mở rộng SQL; cho tự định nghĩa kiểu dữ liệu và hàm; có JSON/JSONB, XML, hstore, kiểu composite và kiểu tự định nghĩa; tính đến bản 18 (9/2025) tuân thủ ít nhất 170/177 tính năng bắt buộc của SQL:2023 Core, và tại thời điểm viết chưa database quan hệ nào tuân thủ đầy đủ."
    product: PostgreSQL
    version: "18"
    checkedAt: 2026-10-14
  - id: pg-connect
    url: https://www.postgresql.org/docs/16/connect-estab.html
    title: "PostgreSQL 16 — 52.2. How Connections Are Established"
    supports: "Tiến trình giám sát postmaster lắng nghe kết nối ở một cổng TCP/IP và sinh một backend process mới cho mỗi yêu cầu kết nối."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: sqlite-serverless
    url: https://www.sqlite.org/serverless.html
    title: "SQLite — SQLite Is Serverless (trang không ghi phiên bản SQLite)"
    supports: "Với SQLite, tiến trình muốn truy cập database đọc ghi trực tiếp file database trên đĩa; không có tiến trình máy chủ trung gian."
    product: SQLite
    checkedAt: 2026-10-15
  - id: sqlite-np1
    url: https://www.sqlite.org/np1queryprob.html
    title: "SQLite — Many Small Queries Are Efficient In SQLite (trang không ghi phiên bản SQLite; cập nhật lần cuối 2025-05-31)"
    supports: "Với database client/server, mỗi câu SQL cần một lượt gửi tin nhắn từ ứng dụng tới máy chủ và quay lại; SQLite chạy trong cùng không gian địa chỉ tiến trình với ứng dụng nên truy vấn chỉ là lời gọi hàm, không có lượt đi về."
    product: SQLite
    checkedAt: 2026-10-15
  - id: sqlite-whentouse
    url: https://www.sqlite.org/whentouse.html
    title: "SQLite — Appropriate Uses For SQLite (trang không ghi phiên bản SQLite)"
    supports: "Nên tránh SQLite khi cùng một database được nhiều máy truy cập trực tiếp và đồng thời qua mạng; SQLite chạy được trên network filesystem nhưng chậm, và lỗi khóa file của nhiều network filesystem có thể làm hỏng database."
    product: SQLite
    checkedAt: 2026-10-15
examples:
  - id: lab-empty-string
    kind: lab-run
    title: "Chuỗi rỗng là một giá trị trên PostgreSQL 16.15, qua được NOT NULL"
    path: lab/experiments/db-database-dbms
    checkedAt: 2026-10-14
  - id: ora-empty-string-null
    kind: official-doc
    title: "Oracle Release 26 coi chuỗi rỗng là NULL"
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Nulls.html
    checkedAt: 2026-10-14
  - id: sqlite-no-server
    kind: official-doc
    title: "SQLite chạy trong tiến trình của ứng dụng, không có máy chủ"
    url: https://www.sqlite.org/serverless.html
    checkedAt: 2026-10-14
changelog:
  - date: 2026-10-14
    note: Claude soạn bản nháp đầu tiên từ tài liệu Oracle và PostgreSQL.
  - date: 2026-10-14
    note: "Kiểm chứng: thêm điều kiện client/server và phản ví dụ SQLite, sửa nghĩa 'database' trong Oracle theo đúng phạm vi, thêm thử nghiệm chuỗi rỗng, viết lại câu hỏi tự kiểm tra."
  - date: 2026-10-15
    note: "Phản biện vòng 2: dẫn nguồn cho lượt đi về và cho rủi ro ghi file, giới hạn câu về khóa vào Oracle, thay câu SQLite trên đĩa bằng khuyến nghị chính thức, viết lại câu hỏi 1–3."
  - date: 2026-10-15
    note: "Phản biện vòng 3: giới hạn câu về transaction và khóa vào Oracle, ghi rõ các trang SQLite không nêu phiên bản."
---

## Vấn đề cần giải quyết

Ứng dụng cần lưu dữ liệu lâu dài, cho nhiều người cùng đọc ghi, tìm lại nhanh và không hỏng khi có lỗi giữa chừng. Ghi thẳng ra file làm được phần lưu, nhưng tài liệu Oracle nêu đúng chỗ yếu: nếu một thao tác atomic cập nhật nhiều file và hệ thống hỏng giữa chừng, các file sẽ không nhất quán[^ora-intro].

Ba từ database, DBMS và RDBMS thường bị dùng lẫn. Dùng đúng giúp đọc tài liệu chính xác, nhất là khi so sánh sản phẩm.

## Cơ chế và luồng hoạt động

- **Database** là một tập thông tin có tổ chức, được coi như một đơn vị[^ora-intro].
- **DBMS** (database management system) là phần mềm kiểm soát việc lưu, tổ chức và truy xuất dữ liệu đó[^ora-intro].
- **RDBMS** là DBMS dựa trên mô hình quan hệ mà E. F. Codd đưa ra năm 1970: dữ liệu nằm trong các quan hệ, thể hiện thành bảng gồm các dòng[^ora-intro].
- **SQL** là ngôn ngữ để làm việc với RDBMS. Câu lệnh SQL mô tả cần kết quả gì; cách lấy kết quả do RDBMS quyết định và thực hiện[^ora-intro].

Khi ứng dụng gửi một truy vấn, RDBMS có thể dùng index để tìm dòng, đọc dữ liệu vào bộ nhớ và làm nhiều bước khác trước khi trả kết quả[^ora-intro]. Các thao tác vật lý này trong suốt với ứng dụng[^ora-intro].

Hai cơ chế giải quyết vấn đề ở trên. Transaction gom các thay đổi thành một đơn vị công việc atomic[^ora-intro]. Khóa là cơ chế ngăn các transaction cùng truy cập một tài nguyên chung phá hỏng thao tác của nhau; Oracle AI Database (Release 26) dùng khóa để kiểm soát truy cập đồng thời[^ora-intro].

**DBMS chạy ở đâu** quyết định ứng dụng nói chuyện với nó thế nào:

- PostgreSQL 16 chạy thành tiến trình máy chủ riêng: tiến trình postmaster lắng nghe ở một cổng TCP/IP và sinh một backend process cho mỗi kết nối[^pg-connect]. Với database client/server như vậy, mỗi câu SQL cần một lượt gửi tin nhắn từ ứng dụng tới máy chủ database rồi quay lại[^sqlite-np1].
- SQLite thì khác: tiến trình của ứng dụng đọc ghi thẳng file database, không có tiến trình máy chủ trung gian[^sqlite-serverless]. Database chạy trong cùng không gian địa chỉ với ứng dụng, nên một truy vấn chỉ là một lời gọi hàm, không có lượt đi về[^sqlite-np1].

**Nghĩa của từ "database" phụ thuộc tài liệu.** Ở phần kiến trúc, tài liệu Oracle AI Database (Release 26) ghi rằng từ bản 21c, "database" chỉ riêng các data file của container database (CDB), pluggable database (PDB) hoặc application container[^ora-intro]. Cùng trang đó vẫn dùng nghĩa chung "tập thông tin có tổ chức" ở phần giới thiệu.

## Điều kiện áp dụng, lợi ích và đánh đổi

Một DBMS đáng dùng khi nhiều người hoặc nhiều tiến trình cùng ghi, cần truy vấn linh hoạt, cần giữ toàn vẹn dữ liệu. Với Oracle AI Database (Release 26), transaction và khóa xử lý hai rủi ro nêu ở trên: file không nhất quán khi hỏng giữa chừng, và các thao tác đồng thời phá nhau[^ora-intro].

Đánh đổi phụ thuộc kiểu DBMS:

- **Máy chủ riêng** (như PostgreSQL): thêm một hệ thống phải vận hành, và mỗi câu SQL tốn một lượt đi về[^sqlite-np1]. Đó là lý do lỗi N+1 (xem bài N+1) gây hại.
- **Nhúng trong ứng dụng** (SQLite): không có lượt đi về[^sqlite-np1]. Đổi lại, SQLite khuyên tránh dùng khi cùng một database được nhiều máy truy cập trực tiếp và đồng thời qua mạng[^sqlite-whentouse]. Đặt file trên network filesystem vẫn chạy, nhưng chậm, và lỗi khóa file của nhiều network filesystem có thể làm hỏng database[^sqlite-whentouse].

"Quan hệ" không có nghĩa là chỉ có bảng với kiểu đơn giản. PostgreSQL tự mô tả là hệ database object-relational. Nó cho tự định nghĩa kiểu dữ liệu và hàm, và có sẵn JSON/JSONB, XML, hstore, kiểu composite[^pg-about].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Gọi sản phẩm là "SQL".** Câu như "hệ thống dùng SQL" không cho biết đó là Oracle, PostgreSQL hay SQL Server. Nhầm ngôn ngữ với hệ quản trị dẫn tới so sánh sai.
- **Cho rằng mọi RDBMS hành xử giống nhau vì cùng chuẩn SQL.** Tính đến bản 18, PostgreSQL tuân thủ ít nhất 170 trên 177 tính năng bắt buộc của SQL:2023 Core. Trang của PostgreSQL ghi rằng tại thời điểm viết, chưa database quan hệ nào tuân thủ đầy đủ chuẩn này[^pg-about]. Dấu hiệu: cùng một câu SQL hoặc cùng dữ liệu cho kết quả khác nhau giữa hai sản phẩm, như chuỗi rỗng ở mục Ví dụ.
- **Đọc tài liệu Oracle với nghĩa thông thường của "database".** Dấu hiệu: nhầm lẫn khi tài liệu nói về instance, CDB, PDB và data file.

## Ví dụ thực tế

- [ex:ora-empty-string-null] — Oracle AI Database (Release 26) hiện coi giá trị ký tự độ dài 0 là null. Tài liệu cũng lưu ý điều này có thể không còn đúng ở bản sau, và khuyên không coi chuỗi rỗng như null[^ora-nulls].
- [ex:lab-empty-string] — trên PostgreSQL 16.15, `'' is null` trả về `false`. Cột `text not null` nhận chuỗi rỗng: bảng có 0 dòng NULL và 1 dòng chuỗi rỗng. Phần Oracle chưa chạy trong lab.
- [ex:sqlite-no-server] — SQLite không có tiến trình máy chủ; tiến trình ứng dụng đọc ghi thẳng file database[^sqlite-serverless].

## Câu hỏi tự kiểm tra

- Một thao tác cập nhật ba file dữ liệu, và máy tắt sau khi ghi xong file thứ hai. Dữ liệu ở trạng thái nào? Transaction và khóa của DBMS xử lý rủi ro này và rủi ro hai tiến trình cùng ghi ra sao?
- Một trang chạy 51 truy vấn. Với PostgreSQL và với SQLite, mỗi truy vấn đi qua những bước gì? Điều này nói gì về chỗ DBMS chạy?
- Một ứng dụng lưu chuỗi rỗng vào cột tiêu đề khai báo NOT NULL để biểu diễn "chưa có tiêu đề", và chạy đúng trên PostgreSQL. Chuyển sang Oracle thì câu insert đó sẽ ra sao, và bài học rút ra về "cùng chuẩn SQL" là gì?

## Chủ đề liên quan và nguồn kiểm chứng
