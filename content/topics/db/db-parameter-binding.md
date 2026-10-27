---
id: db-parameter-binding
title: Bind variable và SQL injection
parent: db-app
summary: "Truyền tham số tách khỏi câu lệnh: chặn SQL injection và giúp dùng lại kế hoạch thực thi."
contentStatus: verified
volatility: slow
verifiedAt: 2026-10-15
verifiedBy: claude
prerequisites:
  - db-drivers
related:
  - ops-owasp-top10
  - db-query-plan
sources:
  - id: owasp-sqli
    url: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
    title: "OWASP Cheat Sheet Series — SQL Injection Prevention"
    supports: "Bốn biện pháp: prepared statement với truy vấn tham số hóa, stored procedure xây dựng đúng, kiểm tra đầu vào theo danh sách cho phép, và escape (bị khuyến cáo mạnh là không dùng, mong manh hơn các biện pháp khác, không bảo đảm chặn mọi SQL injection); với tham số hóa, database luôn phân biệt code và dữ liệu; tên bảng, tên cột, chiều sắp xếp không bind được, lý tưởng là các giá trị đó lấy từ code chứ không từ tham số người dùng."
    checkedAt: 2026-10-15
  - id: ora-cursor
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/tgsql/improving-rwp-cursor-sharing.html
    title: "Oracle AI Database SQL Tuning Guide — Improving Real-World Performance Through Cursor Sharing"
    supports: "Bind variable là chỗ giữ chỗ trong truy vấn (ví dụ :emp_id); câu chỉ khác literal thường không dùng chung được shared SQL area; mọi câu đều hard parse thì tốn thêm bộ nhớ cho cursor, và phải latch shared pool, library cache; optimizer chỉ nhìn giá trị bind lúc hard parse nên kế hoạch có thể không tối ưu cho mọi giá trị; adaptive cursor sharing cho một câu có bind variable dùng nhiều kế hoạch; cách duy nhất để chặn SQL injection là dùng bind variable; nhóm Real-World Performance khuyên mọi ứng dụng doanh nghiệp dùng bind variable; nên để CURSOR_SHARING mặc định EXACT, FORCE không phải giải pháp phát triển lâu dài; ví dụ ba câu < 101, < 120, < 165 cần ba cursor cha."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-14
  - id: pg-prepare
    url: https://www.postgresql.org/docs/16/sql-prepare.html
    title: "PostgreSQL 16 — PREPARE"
    supports: "PREPARE phân tích và viết lại câu lệnh, EXECUTE lập kế hoạch và chạy; prepared statement chỉ tồn tại trong phiên; năm lần chạy đầu dùng custom plan, sau đó chọn generic plan nếu chi phí không cao hơn quá nhiều; có tình huống custom plan hiệu quả hơn nhiều; plan_cache_mode cho ép một trong hai; tham số viết là $1, $2."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: node-pg-queries
    url: https://node-postgres.com/features/queries
    title: "node-postgres — Queries"
    supports: "Truy vấn tham số hóa gửi nguyên văn câu lệnh và các tham số riêng tới máy chủ PostgreSQL, máy chủ tự thay tham số; chỉ khi đặt name thì kế hoạch thực thi mới được cache trên máy chủ, theo từng kết nối; ghép chuỗi tham số vào câu lệnh có thể (và thường) dẫn tới SQL injection."
    product: node-postgres
    checkedAt: 2026-10-15
  - id: mysql-cj-pstmt
    url: https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-prepared-statements.html
    title: "MySQL Connector/J 26.7 — Prepared Statements properties"
    supports: "useServerPrepStmts (dùng prepared statement phía máy chủ nếu máy chủ hỗ trợ) có giá trị mặc định false; khi không tạo được prepared statement phía máy chủ thì tùy emulateUnsupportedPstmts mà báo lỗi hoặc quay về prepared statement giả lập phía client."
    product: MySQL Connector/J
    version: "26.7"
    checkedAt: 2026-10-15
  - id: mysql-cj-impl
    url: https://dev.mysql.com/doc/connector-j/en/connector-j-reference-implementation-notes.html
    title: "MySQL Connector/J 26.7 Developer Guide — JDBC API Implementation Notes"
    supports: "Connector/J có prepared statement phía client và phía máy chủ; mặc định dùng phía client vì các bản MySQL đời đầu chưa hỗ trợ hoặc hỗ trợ lỗi; đặt useServerPrepStmts=true để dùng phía máy chủ."
    product: MySQL Connector/J
    version: "26.7"
    checkedAt: 2026-10-15
  - id: pgjdbc-prepare
    url: https://jdbc.postgresql.org/documentation/server-prepare/
    title: "PostgreSQL JDBC Driver — Server Prepared Statements (trang không ghi phiên bản cho giá trị mặc định này; đối chiếu 15/10/2026)"
    supports: "Driver đếm số lần chạy một câu; khi đạt prepareThreshold (mặc định 5) thì chuyển sang tạo named statement và dùng Prepare, Execute."
    product: pgjdbc
    checkedAt: 2026-10-15
  - id: pg-protocol
    url: https://www.postgresql.org/docs/16/protocol-flow.html
    title: "PostgreSQL 16 — 55.2. Message Flow (Extended Query)"
    supports: "Prepared statement có tên tồn tại tới hết phiên; prepared statement không tên chỉ tồn tại tới lần Parse không tên tiếp theo, và simple Query cũng hủy nó; máy chủ chỉ lưu và dùng lại kế hoạch khi kế hoạch chung không kém nhiều so với kế hoạch theo giá trị cụ thể."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
examples:
  - id: lab-binding
    kind: lab-run
    title: "PostgreSQL 16.15: ghép chuỗi trả về yêu cầu của mọi người, tham số thì không"
    path: lab/experiments/db-parameter-binding
    checkedAt: 2026-10-15
  - id: ora-literals
    kind: official-doc
    title: "Oracle: ba câu chỉ khác literal cần ba cursor cha riêng"
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/tgsql/improving-rwp-cursor-sharing.html
    checkedAt: 2026-10-14
changelog:
  - date: 2026-10-14
    note: Claude soạn bản nháp đầu tiên và chạy thử nghiệm trên PostgreSQL 16.15.
  - date: 2026-10-14
    note: "Kiểm chứng: sửa nhận định 'giá trị luôn đi riêng' (tùy driver, có driver giả lập phía client); nói rõ trên PostgreSQL tham số $1 không tự dùng lại kế hoạch; sửa đánh đổi về phân bố lệch và bind peeking của Oracle; thêm lý do escape không đáng tin; cập nhật URL và phiên bản Oracle."
  - date: 2026-10-15
    note: "Phản biện vòng 2: nêu mặc định prepared statement phía client của Connector/J 26.7 và giới hạn câu của OWASP vào gửi tách rời, thêm truy vấn có name vào lab, tách hành vi dùng lại kế hoạch theo driver (node-postgres, pgjdbc) và điều kiện generic plan của máy chủ, nối câu của Oracle với khuyến nghị danh sách cho phép, viết lại câu hỏi 1, 3, 4."
  - date: 2026-10-15
    note: "Phản biện vòng 3: dẫn nguồn cho prepared statement giả lập phía client và tách phần suy luận của bài, ghi rõ trang pgjdbc không nêu phiên bản."
---

## Vấn đề cần giải quyết

Khi ứng dụng ghép giá trị người dùng nhập vào chuỗi SQL, database không còn phân biệt được đâu là câu lệnh, đâu là dữ liệu. Một chuỗi nhập khéo léo trở thành một phần câu lệnh: đó là **SQL injection**.

Trên Oracle AI Database (Release 26) còn có vấn đề thứ hai. Các câu chỉ khác giá trị literal thường không dùng chung được vùng SQL đã phân tích, nên phải hard parse. Hard parse tốn thêm bộ nhớ cho cursor và buộc phải latch shared pool, library cache[^ora-cursor].

## Cơ chế và luồng hoạt động

Với **bind variable** (tham số), câu lệnh có chỗ giữ chỗ thay cho giá trị: `$1` trên PostgreSQL[^pg-prepare], `:email` trên Oracle[^ora-cursor]. OWASP mô tả rằng với truy vấn tham số hóa, database luôn phân biệt được code và dữ liệu, bất kể người dùng nhập gì[^owasp-sqli]. Câu này mô tả trường hợp câu lệnh và giá trị thực sự đi riêng tới máy chủ. Như mục dưới cho thấy, không phải driver nào cũng gửi như vậy theo mặc định.

**Giá trị đi tới database thế nào tùy driver:**

- node-postgres (driver dùng trong lab) gửi nguyên văn câu lệnh và các tham số riêng tới máy chủ PostgreSQL; máy chủ tự thay tham số[^node-pg-queries].
- MySQL Connector/J 26.7 có hai kiểu prepared statement, phía client và phía máy chủ, và **mặc định dùng phía client**, vì các bản MySQL đời đầu chưa hỗ trợ hoặc hỗ trợ lỗi tính năng này. Muốn dùng phía máy chủ thì đặt `useServerPrepStmts=true`[^mysql-cj-impl]. Khi không tạo được prepared statement phía máy chủ, driver có thể quay về kiểu giả lập phía client[^mysql-cj-pstmt].

Tài liệu Connector/J 26.7 gọi kiểu này là prepared statement giả lập phía client, tức prepared statement không được tạo trên máy chủ[^mysql-cj-pstmt]. Bài này rút ra: khi đó việc giữ giá trị không bị hiểu thành code nằm ở driver chứ không ở máy chủ. Dù driver gửi kiểu nào, ứng dụng vẫn dùng API tham số của driver, không tự ghép chuỗi hay tự escape: OWASP gọi escape là cách mong manh và không bảo đảm chặn mọi SQL injection[^owasp-sqli].

**Dùng lại kế hoạch thực thi khác nhau theo sản phẩm:**

- **Oracle (Release 26):** câu giống hệt nhau về văn bản dùng chung cursor (soft parse). Câu chỉ khác literal phải hard parse[^ora-cursor].
- **PostgreSQL 16:** `PREPARE` phân tích câu lệnh một lần, `EXECUTE` lập kế hoạch và chạy. Năm lần chạy đầu dùng kế hoạch riêng theo giá trị (custom plan), sau đó chuyển sang kế hoạch chung (generic plan) nếu chi phí ước tính không cao hơn quá nhiều. Prepared statement chỉ tồn tại trong phiên[^pg-prepare].
- Dùng `$1` có dẫn tới dùng lại kế hoạch hay không **tùy driver**.
    - node-postgres: kế hoạch chỉ được cache trên máy chủ khi truy vấn có `name`, và cache theo từng kết nối[^node-pg-queries]. Prepared statement không tên chỉ tồn tại tới lần Parse không tên tiếp theo, và một simple Query cũng hủy nó[^pg-protocol]. Lab cho thấy hai truy vấn `$1` không tên không có trong `pg_prepared_statements`, còn truy vấn có `name` thì có, với `from_sql = false`.
    - pgjdbc (driver JDBC của PostgreSQL; trang tài liệu không ghi phiên bản cho giá trị mặc định này, đối chiếu 15/10/2026): driver đếm số lần chạy một câu, và khi đạt `prepareThreshold` (mặc định 5) thì chuyển sang tạo prepared statement có tên[^pgjdbc-prepare].
- Kể cả với prepared statement có tên, máy chủ chỉ lưu và dùng lại kế hoạch khi thấy kế hoạch chung không kém nhiều so với kế hoạch theo giá trị cụ thể[^pg-protocol]. Đây cùng quy tắc custom plan và generic plan đã nói với `PREPARE`.

## Điều kiện áp dụng, lợi ích và đánh đổi

Dùng bind variable cho **mọi giá trị** đến từ bên ngoài. OWASP xếp prepared statement với truy vấn tham số hóa là biện pháp đầu tiên[^owasp-sqli]. Tài liệu Oracle viết rằng cách duy nhất để chặn SQL injection là dùng bind variable, và nhóm Real-World Performance của Oracle khuyên mọi ứng dụng doanh nghiệp dùng chúng[^ora-cursor]. Câu đó nói về giá trị. Tên bảng, tên cột và chiều sắp xếp không bind được, nên OWASP khuyên lấy chúng từ danh sách cho phép trong code thay vì từ tham số người dùng[^owasp-sqli].

**Escape thủ công không thay được bind.** OWASP khuyến cáo mạnh không dùng escape: cách này mong manh hơn các biện pháp khác, và OWASP không thể bảo đảm nó chặn mọi SQL injection trong mọi tình huống[^owasp-sqli].

**Giới hạn:** tên bảng, tên cột, chiều sắp xếp (`ASC`/`DESC`) không bind được. Với các phần này, dùng kiểm tra theo danh sách cho phép hoặc thiết kế lại truy vấn; lý tưởng là giá trị lấy từ code chứ không từ tham số người dùng[^owasp-sqli].

**Đánh đổi với kế hoạch dùng chung:** một kế hoạch có thể không tốt cho mọi giá trị.

- Oracle chỉ nhìn giá trị bind lúc hard parse (bind peeking), nên kế hoạch có thể không tối ưu cho mọi giá trị. Adaptive cursor sharing cho một câu dùng nhiều kế hoạch để giảm vấn đề này[^ora-cursor].
- PostgreSQL 16 ghi rằng có tình huống custom plan hiệu quả hơn nhiều so với generic plan. `plan_cache_mode` cho phép ép một trong hai[^pg-prepare].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Ghép chuỗi ở ô tìm kiếm, bộ lọc hoặc sắp xếp.** Dấu hiệu: code có `"... WHERE x = '" + input + "'"` hoặc template string chứa giá trị người dùng. node-postgres cảnh báo ghép chuỗi tham số vào câu lệnh có thể, và thường, dẫn tới SQL injection[^node-pg-queries].
- **Tự escape thay vì bind.** Dấu hiệu: có hàm tự viết thay dấu nháy.
- **Bind giá trị nhưng ghép tên cột sắp xếp từ query string.** Dấu hiệu: `ORDER BY ${req.query.sort}`.
- **Bật `CURSOR_SHARING=FORCE` trên Oracle thay cho sửa code.** Tài liệu Oracle khuyên để mặc định `EXACT`, và nói `FORCE` không phải giải pháp phát triển lâu dài[^ora-cursor].
- **Trên Oracle, nhiều câu chỉ khác literal.** Dấu hiệu: nhiều cursor cha cho cùng một câu, tốn thêm bộ nhớ, và nhiều tiến trình chờ latch shared pool khi số hard parse tăng[^ora-cursor].

## Ví dụ thực tế

- [ex:lab-binding] — trên PostgreSQL 16.15 với node-postgres 8.16.3, chuỗi nhập `an@example.com' or '1'='1`:
    - Ghép vào câu lệnh: trả về cả 3 yêu cầu của mọi người, kể cả yêu cầu "Lương tháng 9 bị sai" của người khác.
    - Truyền dưới dạng tham số `$1`: trả về 0 dòng. Tham số là đúng email thì trả về 1 dòng.
    - `pg_prepared_statements` liệt kê câu `by_email` đã `PREPARE` tường minh (`from_sql = true`); hai truy vấn `$1` không tên không có trong danh sách.
    - Truy vấn có `name: 'by_email_named'` chạy hai lần rồi xuất hiện trong `pg_prepared_statements` với `from_sql = false`.
- [ex:ora-literals] — tài liệu Oracle minh họa ba câu `SELECT SUM(salary) ... WHERE employee_id < 101`, `< 120`, `< 165` cần ba cursor cha riêng, vì chỉ khác giá trị literal[^ora-cursor].

## Câu hỏi tự kiểm tra

- Vì sao dùng API tham số của driver chặn được SQL injection còn tự viết code escape thì không đáng tin? Với MySQL Connector/J 26.7 để mặc định, ai là bên giữ giá trị không bị hiểu thành code?
- Màn hình danh sách cho phép người dùng chọn cột sắp xếp. Bạn xử lý tham số này thế nào, và vì sao không bind được?
- Trên Oracle, hai câu `WHERE id = 7` và `WHERE id = 8` khác gì so với `WHERE id = :id` về mặt parse? Câu dùng bind có đánh đổi gì về kế hoạch thực thi trên Oracle, và Oracle giảm nó bằng cơ chế nào?
- Một đồng nghiệp nói "dùng `$1` trên PostgreSQL thì kế hoạch được dùng lại". Câu này đúng trong điều kiện nào với node-postgres, với pgjdbc, và máy chủ còn đặt thêm điều kiện gì?

## Chủ đề liên quan và nguồn kiểm chứng
