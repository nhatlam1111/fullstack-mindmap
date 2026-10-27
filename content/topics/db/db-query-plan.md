---
id: db-query-plan
title: Query plan và EXPLAIN
parent: db-storage
summary: Đọc kế hoạch thực thi để biết database đã chọn cách truy cập nào.
contentStatus: draft
volatility: slow
prerequisites:
  - db-index-basics
related:
  - db-joins
  - db-btree
  - db-access-patterns
sources:
  - id: pg-using-explain
    url: https://www.postgresql.org/docs/16/using-explain.html
    title: "PostgreSQL 16 — 14.1. Using EXPLAIN"
    supports: "Kế hoạch là một cây các plan node, node ở đáy là scan node trả dòng thô từ bảng (sequential scan, index scan, bitmap index scan); bốn con số trong ngoặc là chi phí khởi động ước tính, tổng chi phí ước tính, số dòng ước tính, độ rộng dòng ước tính; chi phí tính bằng đơn vị tùy ý; Bitmap Heap Scan là kế hoạch hai bước, node con tìm vị trí dòng qua index, node trên sắp vị trí theo thứ tự vật lý rồi đọc bảng; EXPLAIN ANALYZE thực sự chạy câu lệnh và cho số dòng, thời gian thực tế của từng node; loops là số lần node chạy, thời gian và số dòng thực tế là trung bình mỗi lần; điều thường quan trọng nhất là số dòng ước tính có gần thực tế không; EXPLAIN ANALYZE chạy thật nên có tác dụng phụ, có thể bọc trong BEGIN và ROLLBACK; tùy chọn BUFFERS giúp tìm phần tốn I/O nhất; thời gian của EXPLAIN ANALYZE không gồm chi phí truyền mạng và chuyển đổi I/O, và chi phí đo có thể đáng kể; không suy kết quả từ bảng nhỏ sang bảng lớn."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-planner-stats
    url: https://www.postgresql.org/docs/16/planner-stats.html
    title: "PostgreSQL 16 — 14.2. Statistics Used by the Planner"
    supports: "Planner cần ước tính số dòng truy vấn trả về để chọn kế hoạch tốt; reltuples và relpages không cập nhật tức thì, được VACUUM, ANALYZE và vài lệnh DDL như CREATE INDEX cập nhật; pg_statistic do ANALYZE và VACUUM ANALYZE cập nhật, luôn là gần đúng; giới hạn số mục của most_common_vals và histogram_bounds đặt theo cột bằng ALTER TABLE SET STATISTICS hoặc toàn cục bằng default_statistics_target, mặc định 100, tăng lên có thể ước tính chính xác hơn nhưng tốn chỗ và thời gian; truy vấn chậm thường do các cột trong điều kiện tương quan, planner mặc định coi các điều kiện độc lập; CREATE STATISTICS tạo extended statistics, ANALYZE thu thập dữ liệu."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-indexes-ordering
    url: https://www.postgresql.org/docs/16/indexes-ordering.html
    title: "PostgreSQL 16 — 11.4. Indexes and ORDER BY"
    supports: "Index có thể trả dòng theo thứ tự để thỏa ORDER BY mà không cần bước sắp xếp riêng; trường hợp quan trọng là ORDER BY kèm LIMIT n: sắp xếp tường minh phải xử lý mọi dòng để tìm n dòng đầu, còn index khớp ORDER BY thì lấy thẳng n dòng đầu mà không quét phần còn lại; B-tree quét xuôi cho ORDER BY x, quét ngược cho ORDER BY x DESC."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: ora-explain
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/tgsql/generating-and-displaying-execution-plans.html
    title: "Oracle AI Database SQL Tuning Guide — Generating and Displaying Execution Plans"
    supports: "EXPLAIN PLAN hiển thị kế hoạch optimizer chọn cho SELECT, UPDATE, INSERT, DELETE; kế hoạch được giải thích có thể khác kế hoạch thực tế lúc chạy do khác môi trường; kế hoạch thay đổi khi đầu vào của optimizer thay đổi, chi phí khác do khối lượng dữ liệu và thống kê, kiểu và giá trị bind variable, tham số khởi tạo; DBMS_XPLAN.DISPLAY hiển thị kế hoạch đã giải thích; DISPLAY_CURSOR hiển thị kế hoạch của cursor trong cursor cache kèm thống kê như I/O, bộ nhớ, thời gian; cột E-Rows là ước tính của optimizer, A-Rows là số liệu thực tế khi chạy."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-16
examples:
  - id: lab-query-plan
    kind: lab-run
    title: "Ước tính so với thực tế, cột tương quan, thống kê cũ và ORDER BY ... LIMIT trên PostgreSQL 16.15"
    path: lab/experiments/db-query-plan
    checkedAt: 2026-10-16
  - id: ora-erows-arows
    kind: official-doc
    title: "Tài liệu Oracle: DISPLAY_CURSOR với '+ALLSTATS' cho cột E-Rows (ước tính) và A-Rows (thực tế)"
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/tgsql/generating-and-displaying-execution-plans.html
    checkedAt: 2026-10-16
changelog:
  - date: 2026-10-16
    note: "Claude soạn bài từ tài liệu PostgreSQL 16, Oracle AI Database Release 26 và chạy thử nghiệm trên PostgreSQL 16.15 với 1 triệu dòng."
---

## Vấn đề cần giải quyết

SQL chỉ nói cần kết quả gì; database tự chọn cách lấy (xem bài Database, DBMS và RDBMS). Cùng một câu lệnh có thể quét cả bảng, đi qua index, hay sắp xếp cả triệu dòng để lấy 20 dòng. Khi truy vấn chậm, câu hỏi đầu tiên là database đã chọn cách nào và vì sao. `EXPLAIN` trả lời câu hỏi đó.

## Cơ chế và luồng hoạt động

**Kế hoạch là một cây.** Trên PostgreSQL 16, kế hoạch thực thi là một cây các plan node. Node ở đáy là scan node, trả dòng thô từ bảng: sequential scan, index scan, bitmap index scan[^pg-using-explain]. Node phía trên nhận dòng từ node con để lọc, join, sắp xếp hoặc giới hạn.

**Đọc các con số của `EXPLAIN`.** Mỗi node có bốn con số ước tính: chi phí khởi động, tổng chi phí, số dòng và độ rộng dòng. Chi phí tính bằng đơn vị tùy ý của planner, không phải mili giây[^pg-using-explain].

**`EXPLAIN ANALYZE` chạy thật.** Nó thực sự chạy câu lệnh, rồi in số dòng và thời gian thực tế của từng node bên cạnh số ước tính. Khi một node chạy nhiều lần, `loops` là số lần chạy, còn thời gian và số dòng thực tế là trung bình mỗi lần[^pg-using-explain]. Thêm `BUFFERS` để biết phần nào đọc nhiều trang nhất[^pg-using-explain].

**Số ước tính đến từ thống kê.** Planner cần ước tính số dòng để chọn kế hoạch[^pg-planner-stats]. Thống kê do `ANALYZE` và `VACUUM ANALYZE` thu thập và luôn là gần đúng[^pg-planner-stats]. Mặc định planner coi các điều kiện trong `WHERE` là độc lập với nhau; khi các cột tương quan, ước tính có thể sai, và `CREATE STATISTICS` cho phép thu thập thống kê trên nhiều cột[^pg-planner-stats].

**Một node hay gặp: Bitmap Heap Scan.** Đây là kế hoạch hai bước. Node con đi qua index để tìm vị trí các dòng khớp; node trên sắp các vị trí đó theo thứ tự vật lý rồi mới đọc bảng, để giảm chi phí đọc rời rạc[^pg-using-explain].

**Thứ tự đọc một kế hoạch** (cách bài này đề xuất, dựa trên tài liệu):

1. Node nào ở đáy: quét tuần tự hay qua index.
2. Số dòng ước tính có gần số dòng thực tế không. Tài liệu PostgreSQL 16 gọi đây là điều thường quan trọng nhất cần xem[^pg-using-explain].
3. `Buffers` của từng node: chỗ nào đọc nhiều trang nhất.

**Trên Oracle AI Database (Release 26).** `EXPLAIN PLAN` cho kế hoạch optimizer sẽ chọn, xem bằng `DBMS_XPLAN.DISPLAY`. Kế hoạch này có thể khác kế hoạch thực tế lúc chạy, vì môi trường giải thích và môi trường thực thi khác nhau; với bind variable, output của `EXPLAIN PLAN` có thể không phản ánh kế hoạch thật[^ora-explain]. `DBMS_XPLAN.DISPLAY_CURSOR` cho kế hoạch của cursor đã nằm trong cursor cache, kèm thống kê lúc chạy; với định dạng `+ALLSTATS`, cột `E-Rows` là ước tính và `A-Rows` là thực tế[^ora-explain].

## Điều kiện áp dụng, lợi ích và đánh đổi

- **`EXPLAIN` không chạy câu lệnh**, nên an toàn, nhưng chỉ cho ước tính.
- **`EXPLAIN ANALYZE` chạy thật**, nên lệnh ghi sẽ ghi thật. Tài liệu PostgreSQL 16 gợi ý bọc trong `BEGIN` và `ROLLBACK` nếu không muốn đổi dữ liệu[^pg-using-explain].
- **Thời gian đo có sai lệch.** Thời gian của `EXPLAIN ANALYZE` không gồm chi phí gửi kết quả qua mạng và chuyển đổi dữ liệu, còn bản thân việc đo có thể tốn đáng kể[^pg-using-explain]. So sánh số trang (`Buffers`) thường ổn định hơn so sánh mili giây.
- **Không suy rộng từ bảng nhỏ.** Kết quả trên bảng cỡ đồ chơi không áp dụng được cho bảng lớn[^pg-using-explain].
- **Thống kê chi tiết hơn có giá.** Tăng giới hạn thống kê (mặc định 100) có thể cho ước tính chính xác hơn, đổi lại tốn chỗ và thời gian `ANALYZE`[^pg-planner-stats].
- **Index giúp cả sắp xếp.** Với `ORDER BY` kèm `LIMIT n`, sắp xếp tường minh phải xử lý mọi dòng, còn index khớp `ORDER BY` thì lấy thẳng `n` dòng đầu[^pg-indexes-ordering]. Lab: 11.350 trang so với 4 trang.

## Lỗi thường gặp và dấu hiệu nhận biết

- **Đọc `cost` như thời gian.** Cost là đơn vị tùy ý[^pg-using-explain]. Dấu hiệu: so sánh cost giữa hai máy hoặc hai cấu hình khác nhau.
- **Bỏ qua chênh lệch giữa ước tính và thực tế.** Dấu hiệu: `rows=10` trong khi `actual rows=200`. Nguyên nhân hay gặp là cột tương quan hoặc thống kê cũ (lab bước 2 và 3). Cách sửa: `CREATE STATISTICS` cho cột tương quan, `ANALYZE` khi dữ liệu đổi nhiều[^pg-planner-stats].
- **Đọc sai số dòng của node song song.** `actual rows` là trung bình mỗi lần chạy[^pg-using-explain]. Dấu hiệu: `actual rows=100000 loops=2` mà nghĩ là 100.000 dòng, trong khi tổng là 200.000.
- **Chạy `EXPLAIN ANALYZE` một lệnh ghi trên dữ liệu thật mà không rollback.** Dấu hiệu: dữ liệu bị đổi sau khi "chỉ xem kế hoạch".
- **Tin `EXPLAIN PLAN` của Oracle là kế hoạch đã chạy.** Kế hoạch giải thích có thể khác kế hoạch thực tế[^ora-explain]. Dấu hiệu: `EXPLAIN PLAN` cho thấy index nhưng câu lệnh vẫn chậm; dùng `DISPLAY_CURSOR` để xem kế hoạch thật.

## Ví dụ thực tế

- [ex:lab-query-plan] — trên PostgreSQL 16.15, bảng 1.000.000 yêu cầu:
    - `EXPLAIN` ước tính `rows=199`; `EXPLAIN ANALYZE` cho `actual rows=200`.
    - Cột tương quan: `requester_id = 1234 and department_id = 14` trả 200 dòng nhưng planner ước tính `rows=10`. Sau `create statistics ... (dependencies)` và `analyze`, ước tính thành `rows=199`.
    - Thống kê cũ: bảng `batch` được `analyze` lúc chỉ có 1.000 dòng `pending`, rồi chèn 200.000 dòng `approved`. Planner ước tính `rows=1` cho `approved`; thực tế 200.000. Sau `analyze`, ước tính mỗi tiến trình là 117.766, thực tế 100.000 mỗi tiến trình. Lab tắt autovacuum cho bảng này để thấy rõ hiện tượng.
    - `order by created_at desc limit 20`: không có index thì quét song song cả bảng và `top-N heapsort`, 11.350 trang, 158,812 ms; có index thì `Index Scan Backward`, 20 dòng, 4 trang, 0,024 ms.
    - `EXPLAIN ANALYZE` một lệnh `update` trong transaction: số yêu cầu pending còn 49.990 trong transaction và trở lại 50.000 sau `rollback`.
- [ex:ora-erows-arows] — tài liệu Oracle AI Database (Release 26), phần hướng dẫn xem adaptive query plan, dùng `DBMS_XPLAN.DISPLAY_CURSOR(FORMAT=>'+ALLSTATS')` để đặt cột ước tính `E-Rows` cạnh cột thực tế `A-Rows`. Trong output mẫu của tài liệu, dòng `MERGE JOIN CARTESIAN` có `E-Rows` là 4 còn `A-Rows` là 9135, và tài liệu nhận xét chênh lệch ở phép `MERGE JOIN` là đáng kể[^ora-explain].

## Câu hỏi tự kiểm tra

- Trên PostgreSQL 16, `EXPLAIN` và `EXPLAIN ANALYZE` khác nhau thế nào? Khi nào dùng `EXPLAIN ANALYZE` có thể gây hại, và tránh bằng cách nào?
- Ở lab bước 2, vì sao planner ước tính 10 dòng trong khi thực tế là 200? Lệnh nào sửa được, và nó cho planner biết điều gì?
- Một node có `actual rows=100000 loops=2`. Node đó trả bao nhiêu dòng tất cả?
- Vì sao `order by created_at desc limit 20` đọc 11.350 trang khi chưa có index, nhưng chỉ 4 trang khi đã có index trên `created_at`?

## Chủ đề liên quan và nguồn kiểm chứng
