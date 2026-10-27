---
id: db-access-patterns
title: Mô hình truy vấn và thiết kế dữ liệu
parent: db-storage
summary: Thiết kế dữ liệu bắt đầu từ các truy vấn ứng dụng cần chạy.
contentStatus: draft
volatility: slow
prerequisites:
  - db-index-basics
related:
  - db-document
  - db-normalization
  - db-query-plan
  - db-btree
sources:
  - id: ddb-nosql-design
    url: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html
    title: "Amazon DynamoDB Developer Guide — NoSQL design for DynamoDB"
    supports: "Với RDBMS, dữ liệu truy vấn được linh hoạt nhưng truy vấn tương đối tốn kém và không mở rộng tốt khi lưu lượng cao; với NoSQL như DynamoDB, dữ liệu truy vấn hiệu quả theo một số ít cách, ngoài các cách đó truy vấn có thể tốn kém và chậm; trong DynamoDB, bạn thiết kế schema riêng để truy vấn phổ biến và quan trọng nhất nhanh và rẻ nhất có thể; không nên bắt đầu thiết kế schema cho DynamoDB cho tới khi biết các câu hỏi nó phải trả lời, hiểu bài toán nghiệp vụ và use case của ứng dụng từ đầu là thiết yếu; ba đặc điểm: kích thước dữ liệu, hình dạng dữ liệu (NoSQL tổ chức dữ liệu sao cho hình dạng trong database tương ứng với thứ sẽ được truy vấn, thay vì định hình lại lúc truy vấn như RDBMS), tốc độ dữ liệu; giữ dữ liệu liên quan ở cùng chỗ; giữ ít bảng nhất có thể; dùng thứ tự sắp xếp của khóa để nhóm các item liên quan."
    product: Amazon DynamoDB
    version: Developer Guide bản hiện hành
    checkedAt: 2026-10-16
  - id: ddb-relational-example
    url: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-modeling-nosql-B.html
    title: "Amazon DynamoDB Developer Guide — Example of modeling relational data in DynamoDB"
    supports: "Ví dụ mô hình hóa schema nhập đơn hàng (nhân viên, khách hàng, đơn hàng, sản phẩm, tồn kho) với 15 access pattern; cách thiết kế gom dữ liệu theo access pattern thay vì theo ranh giới thực thể cứng; mỗi bảng có GSI riêng để phục vụ access pattern cần thiết; access pattern 'Get Orders for Customer within Date Range' dùng GSI OrderByCustomerDate với partition key customer_id và sort key order_date, truy vấn customer_id cùng order_date BETWEEN; GSI OpenOrdersByDate là sparse, chỉ index đơn OPEN (20% tổng số) để giảm chi phí lưu trữ GSI, chia 5 shard để phân phối 5.000 lượt ghi mỗi giây; mỗi access pattern dùng tra cứu theo khóa trực tiếp hoặc một truy vấn GSI, tránh quét tốn kém."
    product: Amazon DynamoDB
    version: Developer Guide bản hiện hành
    checkedAt: 2026-10-16
  - id: mongodb-data-modeling
    url: https://www.mongodb.com/docs/manual/data-modeling/
    title: "MongoDB Manual — Data Modeling"
    supports: "Nguyên tắc cốt lõi của mô hình hóa dữ liệu trong MongoDB là dữ liệu được truy cập cùng nhau nên được lưu cùng nhau; nên cấu trúc mô hình dữ liệu dựa trên access pattern của ứng dụng để tối ưu hiệu năng."
    product: MongoDB
    version: "9.0 (Current)"
    checkedAt: 2026-10-16
  - id: pg-indexes-multicolumn
    url: https://www.postgresql.org/docs/16/indexes-multicolumn.html
    title: "PostgreSQL 16 — 11.3. Multicolumn Indexes"
    supports: "Index B-tree nhiều cột dùng được với điều kiện trên bất kỳ tập con cột nào nhưng hiệu quả nhất khi có ràng buộc trên các cột dẫn đầu (bên trái); điều kiện bằng trên các cột dẫn đầu, cộng điều kiện không bằng trên cột đầu tiên không có điều kiện bằng, giới hạn phần index phải quét; ràng buộc trên các cột bên phải được kiểm tra trong index, tiết kiệm lượt vào bảng, nhưng không giảm phần index phải quét; index có thể dùng cho truy vấn chỉ ràng buộc cột sau nhưng phải quét cả index nên trong đa số trường hợp planner chọn quét tuần tự bảng; nên dùng index nhiều cột một cách dè dặt, đa số trường hợp index một cột là đủ; index hơn ba cột khó có ích trừ khi cách dùng bảng rất rập khuôn."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-indexes-ordering
    url: https://www.postgresql.org/docs/16/indexes-ordering.html
    title: "PostgreSQL 16 — 11.4. Indexes and ORDER BY"
    supports: "Index có thể trả dòng theo thứ tự để thỏa ORDER BY mà không cần bước sắp xếp riêng; với ORDER BY kèm LIMIT n, sắp xếp tường minh phải xử lý mọi dòng để tìm n dòng đầu, còn index khớp ORDER BY thì lấy thẳng n dòng đầu."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-index-only-scans
    url: https://www.postgresql.org/docs/16/indexes-index-only-scans.html
    title: "PostgreSQL 16 — 11.9. Index-Only Scans and Covering Indexes"
    supports: "Index-only scan trả giá trị thẳng từ mục index thay vì xem dòng tương ứng trong heap; hai điều kiện: loại index hỗ trợ (B-tree luôn hỗ trợ) và truy vấn chỉ tham chiếu cột lưu trong index; sau khi tìm được mục index, nó xem bit visibility map của trang heap tương ứng, bit bật thì trả dữ liệu ngay, không bật thì phải vào heap, khi đó không hơn index scan thường; chỉ có lợi khi phần đáng kể trang heap đã bật bit all-visible; covering index là index thiết kế để chứa các cột một loại truy vấn chạy thường xuyên cần, tạo bằng mệnh đề INCLUDE; nên dè dặt khi thêm cột payload, nhất là cột rộng: chúng nhân bản dữ liệu và làm index phình, có thể làm tìm chậm; ít có lý do thêm cột payload trừ khi bảng thay đổi đủ chậm để index-only scan thường không phải vào heap."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-indexes-partial
    url: https://www.postgresql.org/docs/16/indexes-partial.html
    title: "PostgreSQL 16 — 11.8. Partial Indexes"
    supports: "Partial index là index xây trên một tập con của bảng, định nghĩa bằng biểu thức điều kiện gọi là predicate, chỉ chứa mục cho dòng thỏa predicate; lý do chính là tránh index các giá trị phổ biến, vì truy vấn tìm giá trị chiếm hơn vài phần trăm số dòng sẽ không dùng index; làm index nhỏ hơn, tăng tốc truy vấn dùng nó và nhiều thao tác cập nhật; chỉ dùng được khi hệ thống nhận ra điều kiện WHERE của truy vấn kéo theo predicate, chỉ nhận ra được các kéo theo bất đẳng thức đơn giản, ngoài ra predicate phải khớp đúng một phần WHERE; việc khớp diễn ra lúc lập kế hoạch nên điều kiện truyền qua tham số không dùng được partial index; đừng dùng nhiều partial index không chồng lấn thay cho partitioning; trong đa số trường hợp lợi thế của partial index so với index thường là tối thiểu."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-createindex
    url: https://www.postgresql.org/docs/16/sql-createindex.html
    title: "PostgreSQL 16 — CREATE INDEX"
    supports: "Mệnh đề INCLUDE chỉ định danh sách cột đưa vào index như cột không phải khóa; cột không phải khóa không dùng được trong điều kiện tìm kiếm của lượt quét index nhưng có thể được trả về bởi index-only scan."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-prepare
    url: https://www.postgresql.org/docs/16/sql-prepare.html
    title: "PostgreSQL 16 — PREPARE"
    supports: "Câu lệnh prepared chạy với generic plan hoặc custom plan; generic plan giống nhau cho mọi lần chạy, custom plan được lập cho một lần chạy với giá trị tham số của lần đó; mặc định (plan_cache_mode = auto) năm lần chạy đầu dùng custom plan, sau đó dùng generic plan nếu chi phí ước tính không cao hơn quá nhiều so với trung bình custom plan; có thể ép bằng plan_cache_mode = force_generic_plan hoặc force_custom_plan; xem kế hoạch bằng EXPLAIN EXECUTE, generic plan chứa ký hiệu tham số $n."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
examples:
  - id: lab-access-patterns
    kind: lab-run
    title: "Một màn hình, năm cách đánh index: index ghép, covering index, partial index trên PostgreSQL 16.15"
    path: lab/experiments/db-access-patterns
    checkedAt: 2026-10-16
  - id: ddb-order-entry
    kind: official-doc
    title: "Tài liệu AWS: mô hình hóa schema nhập đơn hàng trên DynamoDB từ 15 access pattern"
    url: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-modeling-nosql-B.html
    checkedAt: 2026-10-16
changelog:
  - date: 2026-10-16
    note: "Claude soạn bài từ tài liệu PostgreSQL 16, Amazon DynamoDB Developer Guide, MongoDB Manual 9.0 và chạy thử nghiệm trên PostgreSQL 16.15 với 1 triệu dòng."
---

## Vấn đề cần giải quyết

Màn hình "Yêu cầu của tôi" cần 20 yêu cầu mới nhất của một người gửi, trong bảng 1 triệu yêu cầu. Lab thử ba cách đánh index cho đúng truy vấn đó: index trên `created_at` đọc 1.621 trang, index trên `requester_id` đọc 203 trang, index ghép `(requester_id, created_at)` đọc 23 trang. Cả ba đều "có index", nhưng chỉ cách thứ ba khớp với cách màn hình hỏi dữ liệu.

Thiết kế dữ liệu và index mà chưa biết ứng dụng sẽ hỏi gì là đoán. Tài liệu Amazon DynamoDB nói thẳng: không nên bắt đầu thiết kế schema cho tới khi biết các câu hỏi nó phải trả lời[^ddb-nosql-design].

## Cơ chế và luồng hoạt động

**Access pattern là gì.** Access pattern (mô hình truy vấn) là cách ứng dụng đọc và ghi dữ liệu: lọc theo gì, sắp theo gì, lấy cột nào, bao nhiêu dòng mỗi lần, bao thường xuyên. Tài liệu DynamoDB tách ra ba đặc điểm cần biết trước: kích thước dữ liệu, hình dạng dữ liệu và tốc độ dữ liệu (tải truy vấn lúc cao điểm)[^ddb-nosql-design].

**Quan hệ và NoSQL dùng access pattern khác nhau.** Theo tài liệu DynamoDB, với RDBMS dữ liệu truy vấn được linh hoạt, nhưng truy vấn tương đối tốn kém và không mở rộng tốt khi lưu lượng cao. Với NoSQL như DynamoDB, dữ liệu chỉ truy vấn hiệu quả theo một số ít cách; ngoài các cách đó, truy vấn có thể tốn kém và chậm. Vì vậy trong DynamoDB, schema được thiết kế riêng để truy vấn phổ biến và quan trọng nhất nhanh và rẻ nhất[^ddb-nosql-design]. MongoDB cũng đặt nguyên tắc dữ liệu được truy cập cùng nhau nên được lưu cùng nhau, và cấu trúc mô hình dữ liệu theo access pattern của ứng dụng[^mongodb-data-modeling]. Với database quan hệ, bài này tập trung vào phần access pattern quyết định trực tiếp: cần index nào (cách thiết kế bảng nằm ở bài Chuẩn hóa). Phần còn lại làm rõ việc đó trên PostgreSQL 16.

**Index ghép: thứ tự cột quyết định.** Index B-tree nhiều cột dùng được với điều kiện trên bất kỳ tập con cột nào, nhưng hiệu quả nhất khi có điều kiện trên các cột dẫn đầu. Quy tắc chính xác: điều kiện bằng trên các cột dẫn đầu, cộng điều kiện không bằng trên cột đầu tiên không có điều kiện bằng, giới hạn phần index phải quét. Điều kiện trên các cột bên phải được kiểm tra trong index nhưng không giảm phần phải quét[^pg-indexes-multicolumn].

Với truy vấn `where requester_id = 1234 order by created_at desc limit 20`:

- Chỉ index `created_at`: planner đi ngược theo thời gian và bỏ từng dòng không phải của người 1234 (`Rows Removed by Filter: 96774`), 1.621 trang.
- Chỉ index `requester_id`: lấy đủ 200 yêu cầu của người đó rồi sắp xếp để giữ 20 dòng, 203 trang.
- Index `(requester_id, created_at)`: `Index Scan Backward`, không có bước sắp xếp, 23 trang. Index trả dòng theo thứ tự nên với `ORDER BY` kèm `LIMIT`, nó lấy thẳng những dòng đầu mà không cần xử lý hết[^pg-indexes-ordering].

Đảo lại, truy vấn chỉ lọc theo `created_at` (một ngày, 1.440 dòng) khi chỉ có index `(requester_id, created_at)`: planner chọn quét song song cả bảng, 11.236 trang. Tài liệu giải thích: index có thể dùng cho truy vấn chỉ ràng buộc cột sau, nhưng phải quét cả index, nên trong đa số trường hợp planner chọn quét tuần tự bảng[^pg-indexes-multicolumn].

**Covering index và index-only scan.** Index-only scan trả giá trị thẳng từ index mà không xem dòng trong bảng. Nó cần loại index hỗ trợ (B-tree luôn hỗ trợ) và truy vấn chỉ tham chiếu cột có trong index[^pg-index-only-scans]. Màn hình cần thêm `id` và `status`; mệnh đề `INCLUDE` đưa chúng vào index như cột không phải khóa, không dùng để tìm nhưng trả về được bởi index-only scan[^pg-createindex]. Index như vậy gọi là covering index[^pg-index-only-scans].

Có một điều kiện ngầm: với mỗi mục tìm được, PostgreSQL xem bit trong visibility map của trang bảng tương ứng. Bit bật thì trả dữ liệu ngay; không bật thì vẫn phải vào bảng[^pg-index-only-scans]. Lab: ngay sau khi nạp dữ liệu, `Index Only Scan Backward` vẫn có `Heap Fetches: 20` và đọc 23 trang; sau `VACUUM`, `Heap Fetches: 0` và chỉ còn 4 trang.

**Partial index cho tập con hay hỏi.** Partial index chỉ chứa mục cho các dòng thỏa một điều kiện (predicate)[^pg-indexes-partial]. Danh sách "chờ duyệt" chỉ hỏi yêu cầu `pending` (5% số dòng). Lab: index `(created_at) where status = 'pending'` chiếm 1.112 kB, trong khi index `(status, created_at)` cho cả bảng chiếm 38 MB. Khi có cả hai, truy vấn 20 yêu cầu chờ duyệt mới nhất dùng partial index và đọc 7 trang.

## Điều kiện áp dụng, lợi ích và đánh đổi

- **Mỗi index là một khoản phí khi ghi.** Trong lab của bài Index, chèn 200.000 dòng vào bảng có 4 index chậm hơn từ 4,9 đến 6,5 lần tùy lượt so với bảng không có index. Vì vậy chỉ thêm index cho access pattern thật sự quan trọng.
- **Index nhiều cột: dè dặt.** Tài liệu PostgreSQL 16 khuyên dùng index nhiều cột một cách dè dặt; đa số trường hợp index một cột là đủ, và index hơn ba cột khó có ích trừ khi cách dùng bảng rất rập khuôn[^pg-indexes-multicolumn].
- **Covering index chỉ đáng khi bảng ít thay đổi.** Index-only scan chỉ có lợi khi phần đáng kể trang của bảng đã được đánh dấu all-visible. Cột payload nhân bản dữ liệu và làm index phình; tài liệu khuyên dè dặt, nhất là với cột rộng[^pg-index-only-scans].
- **Partial index đòi hiểu planner.** Tạo partial index nghĩa là bạn biết ít nhất bằng planner khi nào index có lợi; trong đa số trường hợp lợi thế so với index thường là tối thiểu[^pg-indexes-partial]. Nó đáng dùng khi tập con nhỏ và hay được hỏi, như danh sách chờ duyệt trong lab.
- **Thiết kế theo access pattern ở NoSQL có hai mặt.** Truy vấn đã tính trước thì nhanh và rẻ; truy vấn ngoài các cách đó có thể tốn kém và chậm[^ddb-nosql-design].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Đánh index từng cột riêng lẻ cho truy vấn vừa lọc vừa sắp.** Dấu hiệu: `Rows Removed by Filter` rất lớn trên một `Index Scan` (lab bước 1), hoặc `Bitmap Heap Scan` theo sau là `Sort` (lab bước 2).
- **Sai thứ tự cột trong index ghép.** Dấu hiệu: truy vấn chỉ lọc theo cột thứ hai vẫn `Seq Scan` dù cột đó có trong index (lab bước 4)[^pg-indexes-multicolumn].
- **Truy vấn lấy thêm cột không có trong index.** Index-only scan đòi truy vấn chỉ tham chiếu cột có trong index[^pg-index-only-scans]. Dấu hiệu: kế hoạch là `Index Scan` chứ không phải `Index Only Scan`, dù đã tạo covering index.
- **Mong index-only scan ngay sau khi nạp dữ liệu lớn.** Dấu hiệu: `Heap Fetches` gần bằng số dòng trả về. Visibility map chưa đánh dấu trang; sau `VACUUM` (thủ công hoặc autovacuum) thì giảm (lab bước 5).
- **Truyền điều kiện của partial index qua tham số.** Việc khớp predicate diễn ra lúc lập kế hoạch, nên tài liệu PostgreSQL 16 lưu ý điều kiện truyền qua tham số không dùng được partial index[^pg-indexes-partial]. Câu lệnh prepared có thể chạy bằng custom plan (lập riêng cho giá trị tham số của lần chạy) hoặc generic plan (giống nhau cho mọi lần chạy); mặc định, 5 lần chạy đầu dùng custom plan rồi PostgreSQL mới cân nhắc chuyển sang generic plan[^pg-prepare]. Lab bước 7: cùng câu `where status = $1` chạy với `'pending'`, custom plan dùng partial index, generic plan thì không. Dấu hiệu: `EXPLAIN EXECUTE` cho kế hoạch có `$1` và không có partial index[^pg-prepare]. Nếu danh sách luôn là `pending`, giữ giá trị cố định trong câu SQL.
- **Tạo hàng loạt partial index không chồng lấn để thay partitioning.** Tài liệu gọi đây là ý tưởng tồi; một index thường trên `(category, data)` hầu như luôn tốt hơn, còn bảng quá lớn thì xem xét partitioning[^pg-indexes-partial].
- **Thiết kế schema NoSQL trước khi biết câu hỏi.** Dấu hiệu: sau khi đưa vào dùng mới phát hiện màn hình quan trọng phải quét cả bảng[^ddb-nosql-design].

## Ví dụ thực tế

[ex:lab-access-patterns] — PostgreSQL 16.15, bảng 1.000.000 yêu cầu của 5.000 người gửi:

| Bước | Index | Truy vấn | Kế hoạch | Trang đọc |
|---|---|---|---|---|
| 1 | `(created_at)` | 20 yêu cầu mới nhất của người 1234 | `Index Scan Backward`, bỏ 96.774 dòng | 1.621 |
| 2 | `(requester_id)` | như trên | `Bitmap Heap Scan` 200 dòng rồi `Sort` | 203 |
| 3 | `(requester_id, created_at)` | như trên | `Index Scan Backward` | 23 |
| 4 | `(requester_id, created_at)` | đếm yêu cầu trong một ngày | `Parallel Seq Scan` | 11.236 |
| 5 | `(requester_id, created_at) include (id, status)` | như bước 3 | `Index Only Scan Backward`, trước/sau `VACUUM` | 23 / 4 |
| 6 | `(created_at) where status = 'pending'` và `(status, created_at)` | 20 yêu cầu chờ duyệt mới nhất | `Index Scan Backward` trên partial index | 7 |
| 7 | như bước 6 | như bước 6, nhưng `status = $1` | custom plan dùng partial index; generic plan dùng `(status, created_at)` | không đo |

[ex:ddb-order-entry] — tài liệu Amazon DynamoDB mô hình hóa một schema nhập đơn hàng (nhân viên, khách hàng, đơn hàng, sản phẩm, tồn kho) từ danh sách 15 access pattern, gom dữ liệu theo access pattern thay vì theo ranh giới thực thể[^ddb-relational-example]. Hai thiết kế trong đó tương ứng với hai bước của lab:

- Access pattern "Get Orders for Customer within Date Range" dùng GSI `OrderByCustomerDate` với partition key `customer_id` và sort key `order_date`, truy vấn một khách hàng với `order_date BETWEEN ...`[^ddb-relational-example]. Cùng ý tưởng với index `(requester_id, created_at)` ở bước 3.
- Access pattern "Show all Open Orders within Date Range" dùng GSI `OpenOrdersByDate` dạng sparse: chỉ index các đơn `OPEN` (20% tổng số) để giảm chi phí lưu trữ GSI, chia 5 shard để phân phối 5.000 lượt ghi mỗi giây[^ddb-relational-example]. Cùng ý tưởng với partial index cho yêu cầu `pending` ở bước 6.

## Câu hỏi tự kiểm tra

- Với truy vấn "20 yêu cầu mới nhất của một người", vì sao index `(requester_id, created_at)` tốt hơn index `(created_at, requester_id)`? Dựa vào quy tắc nào của index nhiều cột?
- Ở lab bước 4, vì sao planner không dùng index `(requester_id, created_at)` cho truy vấn lọc theo `created_at`?
- Covering index cần những điều kiện gì để thực sự tránh được việc đọc bảng? Vì sao `Heap Fetches` giảm từ 20 xuống 0 sau `VACUUM`?
- Khi nào partial index đáng dùng? Ở lab bước 7, vì sao generic plan không dùng partial index dù giá trị truyền vào là `'pending'`?
- Theo tài liệu DynamoDB, thiết kế dữ liệu cho RDBMS và cho DynamoDB khác nhau ở điểm xuất phát thế nào?

## Chủ đề liên quan và nguồn kiểm chứng
