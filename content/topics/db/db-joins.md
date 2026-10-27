---
id: db-joins
title: Join
parent: db-relational
summary: Các kiểu join và cách database thực hiện chúng.
contentStatus: verified
verifiedAt: 2026-10-15
verifiedBy: claude
volatility: stable
prerequisites:
  - db-tables-keys-constraints
related:
  - db-query-plan
  - db-n-plus-one
  - db-index-basics
sources:
  - id: pg-joins
    url: https://www.postgresql.org/docs/16/queries-table-expressions.html
    title: "PostgreSQL 16 — 7.2. Table Expressions (7.2.1.1 Joined Tables)"
    supports: "Định nghĩa CROSS JOIN (tích Descartes, N * M dòng), INNER JOIN, LEFT, RIGHT, FULL OUTER JOIN và cách điền NULL; điều kiện ở ON được xử lý trước khi join, điều kiện ở WHERE được xử lý sau khi join, không quan trọng với inner join nhưng rất quan trọng với outer join; ví dụ t1/t2 với điều kiện t2.value = 'xxx' ở ON cho 3 dòng, ở WHERE cho 1 dòng; USING khá an toàn trước thay đổi cột, NATURAL rủi ro hơn nhiều vì cột trùng tên mới sẽ bị đưa vào điều kiện join. FROM T1, T2 tương đương T1 CROSS JOIN T2."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: pg-planner
    url: https://www.postgresql.org/docs/16/planner-optimizer.html
    title: "PostgreSQL 16 — 52.5. Planner/Optimizer"
    supports: "Ba chiến lược join: nested loop (quét bảng bên phải một lần cho mỗi dòng bên trái, có thể tốt nếu bên phải quét được bằng index), merge join (sắp xếp hai bên theo khóa join rồi quét song song, sắp xếp bằng bước sort hoặc index), hash join (nạp bảng bên phải vào bảng băm theo khóa join rồi dò từng dòng bên trái); với hơn hai quan hệ, planner xét các thứ tự join khác nhau và chọn kế hoạch có chi phí ước tính thấp nhất; vượt geqo_threshold thì dùng heuristic."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
  - id: ora-joins
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/tgsql/joins.html
    title: "Oracle AI Database SQL Tuning Guide — Joins"
    supports: "Phương thức join: nested loops, sort merge, hash join; nested loops hữu ích khi join tập con nhỏ hoặc điều kiện join là cách truy cập hiệu quả bảng bên trong; hash join khi phải join lượng dữ liệu tương đối lớn và là equijoin; sort merge có thể được chọn khi điều kiện join không phải equijoin; không có điều kiện join thì thành Cartesian join; outer join trả về các dòng thỏa điều kiện và các dòng của một bảng không khớp dòng nào ở bảng kia; optimizer sinh các kế hoạch theo thứ tự join, phương thức join, đường truy cập, ước tính chi phí và chọn kế hoạch rẻ nhất; trong phần về nested loops, số dòng dự kiến của join chứ không phải kích thước bảng quyết định lựa chọn; nested loops nói chung hợp nhất với bảng nhỏ có index trên điều kiện join."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-15
  - id: pg-comparison
    url: https://www.postgresql.org/docs/16/functions-comparison.html
    title: "PostgreSQL 16 — 9.2. Comparison Functions and Operators"
    supports: "Toán tử so sánh thường cho kết quả null (không biết), không phải true hay false, khi một đầu vào là null; kiểm tra null bằng IS NULL, IS NOT NULL."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-15
examples:
  - id: lab-joins
    kind: lab-run
    title: "Inner, left join, ON so với WHERE, đếm trùng và thuật toán join trên PostgreSQL 16.15"
    path: lab/experiments/db-joins
    checkedAt: 2026-10-15
  - id: pg-on-vs-where
    kind: official-doc
    title: "Tài liệu PostgreSQL 16: cùng điều kiện t2.value = 'xxx' ở ON cho 3 dòng, ở WHERE cho 1 dòng"
    url: https://www.postgresql.org/docs/16/queries-table-expressions.html
    checkedAt: 2026-10-15
changelog:
  - date: 2026-10-15
    note: "Claude soạn bài từ tài liệu PostgreSQL 16, Oracle AI Database Release 26 và chạy thử nghiệm join trên PostgreSQL 16.15."
  - date: 2026-10-15
    note: "Phản biện: giới hạn câu ON/WHERE vào phép so sánh và nêu ngoại lệ IS NULL, thêm điều kiện geqo_threshold, đặt câu của Oracle về số dòng đúng ngữ cảnh nested loops, giải thích bảng được băm trong lab, thêm bước lab cho FROM T1, T2 và JOIN thiếu ON, dẫn lab Normalization cho đánh đổi."
  - date: 2026-10-15
    note: "Kiểm chứng: qua phản biện độc lập, đã xử lý mọi phát hiện; chuyển sang Đã kiểm chứng."
---

## Vấn đề cần giải quyết

Dữ liệu đã normalize nằm ở nhiều bảng: người dùng một bảng, phòng ban một bảng, yêu cầu một bảng. Màn hình "danh sách yêu cầu kèm tên người gửi và phòng ban" cần ghép chúng lại. Join là cách ghép đó. Viết sai join thì truy vấn vẫn chạy, chỉ là kết quả thiếu dòng hoặc đếm sai mà không báo lỗi gì.

## Cơ chế và luồng hoạt động

**Join giữ lại những dòng nào**, theo tài liệu PostgreSQL 16[^pg-joins]:

| Kiểu | Kết quả |
| --- | --- |
| `INNER JOIN` | Với mỗi dòng của T1, một dòng cho mỗi dòng của T2 thỏa điều kiện join |
| `LEFT OUTER JOIN` | Làm inner join, rồi thêm mỗi dòng của T1 không khớp dòng nào ở T2, với các cột của T2 là NULL. Mỗi dòng của T1 có ít nhất một dòng trong kết quả |
| `RIGHT OUTER JOIN` | Ngược lại với left join: mỗi dòng của T2 có ít nhất một dòng |
| `FULL OUTER JOIN` | Làm inner join, rồi thêm cả dòng không khớp của T1 lẫn của T2 |
| `CROSS JOIN` | Mọi cặp dòng (tích Descartes): N dòng và M dòng cho N × M dòng |

**Điều kiện đặt ở `ON` hay `WHERE`.** Điều kiện ở `ON` được xử lý *trước* khi join, điều kiện ở `WHERE` được xử lý *sau* khi join. Với inner join thì như nhau, nhưng với outer join thì khác hẳn[^pg-joins]. Phép so sánh thường với NULL cho kết quả NULL ("không biết"), không phải true hay false[^pg-comparison]. Vì vậy một phép so sánh trên bảng bên phải, như `r.status = 'pending'`, đặt ở `WHERE` sẽ loại các dòng mà left join vừa điền NULL. Ngược lại, điều kiện `WHERE r.id IS NULL` giữ đúng các dòng không khớp, vì `IS NULL` là cách kiểm một giá trị có phải NULL không[^pg-comparison].

**Database thực hiện join thế nào.** Planner của PostgreSQL 16 có ba chiến lược[^pg-planner]:

- **Nested loop:** quét bảng bên phải một lần cho mỗi dòng bên trái. Đơn giản nhưng có thể rất tốn, trừ khi bên phải quét được bằng index với giá trị lấy từ dòng bên trái.
- **Merge join:** sắp xếp hai bên theo khóa join, rồi quét song song và ghép các dòng khớp. Mỗi bên chỉ quét một lần; việc sắp xếp có thể là một bước sort riêng hoặc đọc theo index trên khóa join.
- **Hash join:** quét bảng bên phải và nạp vào một bảng băm theo khóa join, rồi quét bên trái và dò bảng băm cho từng dòng.

"Trái" và "phải" ở đây là hai đầu vào của bước join trong kế hoạch, do planner chọn. Ở lab, bảng băm được dựng từ `users` (nút `Hash` nằm trên `Seq Scan on users u`), dù `users` đứng trước trong câu SQL.

Với nhiều hơn hai bảng, planner xét các thứ tự join khác nhau và chọn kế hoạch có chi phí ước tính thấp nhất. Việc tìm gần như vét cạn này chỉ áp dụng khi số bảng dưới `geqo_threshold`; vượt ngưỡng thì planner dùng heuristic[^pg-planner]. Oracle AI Database (Release 26) cũng có nested loops, hash join và sort merge. Optimizer của Oracle sinh các kế hoạch theo thứ tự join, phương thức join và đường truy cập, ước tính chi phí từng kế hoạch rồi chọn kế hoạch rẻ nhất. Khi bàn về nested loops, tài liệu Oracle nhấn mạnh rằng số dòng dự kiến của join, chứ không phải kích thước bảng, quyết định lựa chọn[^ora-joins].

## Điều kiện áp dụng, lợi ích và đánh đổi

**Chọn kiểu join theo câu hỏi nghiệp vụ.** "Yêu cầu nào kèm người gửi" là inner join. "Mọi nhân viên, kể cả người chưa gửi yêu cầu" là left join từ bảng nhân viên. Chọn sai kiểu thì mất dòng hoặc thừa dòng NULL.

**Thuật toán join là việc của database**, nhưng phụ thuộc vào thứ bạn cung cấp. Theo Oracle Release 26, nested loops hợp khi join các tập con nhỏ hoặc khi điều kiện join là cách truy cập hiệu quả bảng bên trong; hash join được cân nhắc khi phải join lượng dữ liệu tương đối lớn và điều kiện là phép bằng; sort merge có thể được chọn khi điều kiện join là bất đẳng thức[^ora-joins]. Trong lab PostgreSQL, cùng một join đổi từ hash join sang nested loop khi chỉ lấy một người dùng. PostgreSQL 16 ghi rằng nested loop có thể là chiến lược tốt khi bảng bên phải quét được bằng index[^pg-planner]; Oracle ghi rằng nested loops nói chung hợp nhất với bảng nhỏ có index trên điều kiện join[^ora-joins]. Vì vậy index trên cột dùng để join là một phần của thiết kế (xem bài Query plan và EXPLAIN).

**Đánh đổi của schema đã normalize** là phải join nhiều hơn: ở lab của bài Normalization, thiết kế đã tách cần hai join để lấy tên phòng ban của một yêu cầu. Đó là cái giá để mỗi sự thật nằm ở một chỗ.

## Lỗi thường gặp và dấu hiệu nhận biết

- **Lọc bảng bên phải ở `WHERE` sau left join.** Điều kiện này chạy sau join nên loại mất các dòng không khớp[^pg-joins]. Dấu hiệu: báo cáo "mọi nhân viên" thiếu những người chưa có dữ liệu; số dòng bằng inner join có cùng điều kiện.
- **Đếm trùng khi join nhiều bảng.** Mỗi dòng bên trái lặp lại một lần cho mỗi dòng khớp bên phải. Dấu hiệu: `count(...)` hoặc `sum(...)` lớn hơn thực tế sau khi thêm một join; `count(distinct ...)` cho số khác `count(...)` (lab bước 4).
- **Quên điều kiện nối khi viết `FROM T1, T2`.** Tài liệu PostgreSQL 16 ghi `FROM T1, T2` tương đương `T1 CROSS JOIN T2`[^pg-joins], nên quên điều kiện nối trong `WHERE` cho ra tích Descartes N × M dòng; Oracle cũng thực hiện Cartesian join khi câu lệnh không có điều kiện join[^ora-joins]. Với cú pháp `JOIN`, PostgreSQL 16.15 báo lỗi cú pháp nếu thiếu `ON` (lab bước 5). Dấu hiệu: số dòng kết quả bằng tích số dòng của hai bảng.
- **Dùng `NATURAL JOIN`.** Tài liệu PostgreSQL 16 ghi rằng `NATURAL` rủi ro hơn nhiều so với `USING`: thêm một cột trùng tên ở một trong hai bảng là cột đó tự động thành điều kiện join[^pg-joins]. Dấu hiệu: truy vấn đang đúng bỗng trả về ít dòng hơn sau một migration không liên quan.

## Ví dụ thực tế

- [ex:lab-joins] — trên PostgreSQL 16.15, 4 người dùng (Chi không có yêu cầu, Dũng không thuộc phòng ban nào) và 5 yêu cầu:
    - Inner join ra 5 dòng, không có Chi. Left join ra 6 dòng, dòng của Chi có `request_id` NULL.
    - Đếm yêu cầu `pending` mỗi người: điều kiện ở `WHERE` còn 2 người; cùng điều kiện ở `ON` đủ 4 người, Bình và Chi là 0.
    - Đếm người mỗi phòng: không join requests thì Nhân sự 1, Kỹ thuật 2; join thêm requests thì `count(u.id)` thành 2 và 3, `count(distinct u.id)` vẫn là 1 và 2.
    - `from departments d, users u` không có điều kiện nối cho 12 dòng (3 × 4); `departments d join users u` thiếu `ON` bị lỗi `42601: syntax error at end of input`.
    - Với 5.000 người dùng và 200.000 yêu cầu: join toàn bộ dùng `Hash Join`, bảng băm dựng từ `users`. Thêm `where u.id = 7` thì thành `Nested Loop`, đọc `users` qua `users_pkey` và `requests` qua index `requests_requester_idx`, ra 40 dòng.
- [ex:pg-on-vs-where] — tài liệu PostgreSQL 16 có ví dụ hai bảng `t1`, `t2`: `LEFT JOIN t2 ON t1.num = t2.num AND t2.value = 'xxx'` cho 3 dòng, còn `LEFT JOIN t2 ON t1.num = t2.num WHERE t2.value = 'xxx'` chỉ cho 1 dòng[^pg-joins].

## Câu hỏi tự kiểm tra

- Báo cáo cần "mọi nhân viên kèm số yêu cầu đang chờ duyệt, kể cả người có 0". Viết join thế nào, và đặt điều kiện `status = 'pending'` ở đâu? Giải thích bằng thứ tự xử lý `ON` và `WHERE`.
- Sau khi thêm một join, tổng số người trong báo cáo tăng lên. Nguyên nhân là gì, và bạn kiểm tra thế nào?
- Ở lab, vì sao cùng một join lúc dùng hash join, lúc dùng nested loop? Theo tài liệu Oracle, yếu tố nào quyết định lựa chọn?
- Vì sao `NATURAL JOIN` có thể làm một truy vấn đang đúng thành sai mà không ai sửa truy vấn đó?

## Chủ đề liên quan và nguồn kiểm chứng
