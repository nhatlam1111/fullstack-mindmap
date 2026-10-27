---
id: db-index-basics
title: Index
parent: db-storage
summary: Index giúp tìm dữ liệu nhanh hơn với chi phí khi ghi và dung lượng.
contentStatus: draft
volatility: stable
prerequisites:
  - db-tables-keys-constraints
related:
  - db-btree
  - db-query-plan
  - db-access-patterns
sources:
  - id: pg-indexes-intro
    url: https://www.postgresql.org/docs/16/indexes-intro.html
    title: "PostgreSQL 16 — 11.1. Introduction (Indexes)"
    supports: "Không có index, hệ thống phải quét cả bảng từng dòng để tìm dòng khớp; có index trên cột thì có thể chỉ cần đi xuống vài tầng của một cây tìm kiếm; hệ thống tự cập nhật index khi bảng thay đổi và dùng index khi cho là hiệu quả hơn quét tuần tự; có thể phải chạy ANALYZE thường xuyên để planner có thống kê; index phải được đồng bộ với bảng nên thêm chi phí cho thao tác ghi, có thể ngăn heap-only tuple, index ít hoặc không dùng nên xóa; index giúp cả UPDATE, DELETE có điều kiện tìm kiếm và join; tạo index trên bảng lớn có thể lâu, mặc định cho đọc song song nhưng chặn ghi tới khi xong."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-index-types
    url: https://www.postgresql.org/docs/16/indexes-types.html
    title: "PostgreSQL 16 — 11.2. Index Types"
    supports: "PostgreSQL có các loại index B-tree, Hash, GiST, SP-GiST, GIN, BRIN và extension bloom; CREATE INDEX mặc định tạo B-tree, hợp với phần lớn tình huống."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-indexes-examine
    url: https://www.postgresql.org/docs/16/indexes-examine.html
    title: "PostgreSQL 16 — 11.12. Examining Index Usage"
    supports: "Luôn chạy ANALYZE trước, xem xét việc dùng index mà không ANALYZE là vô ích; dùng dữ liệu thật để thử, dữ liệu thử chỉ cho biết index cần cho dữ liệu thử; đặc biệt tai hại khi dùng tập dữ liệu rất nhỏ: 1 trên 100 dòng khó là ứng viên cho index vì 100 dòng có thể nằm trong một trang; có thể tắt các kiểu kế hoạch như enable_seqscan để ép dùng index khi thử nghiệm."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-createindex
    url: https://www.postgresql.org/docs/16/sql-createindex.html
    title: "PostgreSQL 16 — CREATE INDEX"
    supports: "Với CONCURRENTLY, PostgreSQL tạo index mà không lấy khóa chặn insert, update, delete đồng thời, trong khi tạo index thường chặn ghi (không chặn đọc) tới khi xong; cách này cần nhiều công hơn và lâu hơn đáng kể."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-monitoring
    url: https://www.postgresql.org/docs/16/monitoring-stats.html
    title: "PostgreSQL 16 — 28.2. The Cumulative Statistics System"
    supports: "pg_stat_all_indexes có một dòng cho mỗi index, cho thống kê về việc truy cập index đó; pg_stat_user_indexes giống vậy nhưng chỉ cho index trên bảng của người dùng; thống kê tích lũy không cập nhật tức thì, mỗi tiến trình đẩy thống kê ra trước khi rảnh nhưng không thường hơn mỗi giây."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: ora-indexes
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/indexes-and-index-organized-tables.html
    title: "Oracle AI Database Concepts — Indexes and Index-Organized Tables"
    supports: "Index là cấu trúc tùy chọn gắn với bảng, đôi khi làm truy cập dữ liệu nhanh hơn; độc lập về logic và vật lý với dữ liệu bảng nên tạo hay xóa index không ảnh hưởng vật lý tới bảng; index là đường truy cập nhanh tới một dòng, chỉ ảnh hưởng tốc độ; nên cân nhắc tạo index khi cột được truy vấn thường xuyên và trả về tỷ lệ nhỏ số dòng, khi có ràng buộc tham chiếu (tránh khóa toàn bảng khi sửa hoặc xóa ở bảng cha), hoặc khi muốn tự chỉ định index cho unique key; database phải cập nhật index khi có DML, gây chi phí hiệu năng; nhiều index trên một bảng làm DML chậm đi."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-16
examples:
  - id: lab-index-basics
    kind: lab-run
    title: "Tìm 200 trong 1 triệu yêu cầu có và không có index, và giá khi ghi (PostgreSQL 16.15)"
    path: lab/experiments/db-index-basics
    checkedAt: 2026-10-16
changelog:
  - date: 2026-10-16
    note: "Claude soạn bài từ tài liệu PostgreSQL 16, Oracle AI Database Release 26 và chạy thử nghiệm trên PostgreSQL 16.15 với 1 triệu dòng."
---

## Vấn đề cần giải quyết

Màn hình "Yêu cầu của tôi" cần 200 yêu cầu của một người trong bảng 1 triệu dòng. Không có chuẩn bị gì trước, PostgreSQL 16 phải quét cả bảng, từng dòng một, để tìm dòng khớp[^pg-indexes-intro]. Trong lab, bảng chiếm 88 MB, và tìm 200 dòng đó phải đọc 11.236 trang, tức toàn bộ bảng.

Index là cách để không phải làm vậy.

## Cơ chế và luồng hoạt động

**Index là gì.** Tài liệu Oracle AI Database (Release 26) định nghĩa index là một cấu trúc tùy chọn gắn với bảng, đôi khi làm truy cập dữ liệu nhanh hơn. Index độc lập về logic và vật lý với dữ liệu của bảng: tạo hay xóa index không đụng tới dữ liệu đó[^ora-indexes]. Có index trên cột cần tìm thì database có thể chỉ cần đi xuống vài tầng của một cây tìm kiếm thay vì quét cả bảng[^pg-indexes-intro].

**Có nhiều loại index.** PostgreSQL 16 có B-tree, Hash, GiST, SP-GiST, GIN, BRIN và extension bloom. `CREATE INDEX` mặc định tạo B-tree, loại hợp với phần lớn tình huống[^pg-index-types]. Cấu trúc của B-tree được giải thích ở bài B-tree.

**Ai quyết định dùng index.** Tạo index xong thì PostgreSQL tự cập nhật nó mỗi khi bảng thay đổi. Hệ thống dùng index khi cho rằng làm vậy hiệu quả hơn quét tuần tự; để quyết định đúng, planner cần thống kê, và bạn có thể phải chạy `ANALYZE` thường xuyên[^pg-indexes-intro]. Cách đọc quyết định của planner nằm ở bài Query plan và EXPLAIN.

**Index giúp những câu lệnh nào.** Không chỉ `SELECT`: index còn giúp `UPDATE` và `DELETE` có điều kiện tìm kiếm, và giúp join khi index nằm trên cột của điều kiện join[^pg-indexes-intro].

Trong lab, sau khi tạo index trên `requester_id`, cùng truy vấn chỉ đọc 3 trang index và 200 trang bảng, thay vì 11.236 trang.

## Điều kiện áp dụng, lợi ích và đánh đổi

**Khi nào nên cân nhắc index.** Theo Oracle AI Database (Release 26)[^ora-indexes]:

- cột được truy vấn thường xuyên và trả về một tỷ lệ nhỏ số dòng của bảng;
- cột có ràng buộc tham chiếu, để tránh khóa toàn bảng khi sửa khóa chính hoặc xóa ở bảng cha;
- bảng sẽ có unique key và bạn muốn tự chỉ định index cho nó.

Điều kiện "tỷ lệ nhỏ" thấy rõ trong lab. Index trên `status` được dùng khi lọc `pending` (5% số dòng), nhưng planner bỏ qua nó khi lọc `approved` (75%) và quét cả bảng.

**Giá phải trả khi ghi.** Index phải luôn đồng bộ với bảng, nên mọi thao tác ghi tốn thêm công. Index còn có thể ngăn tối ưu heap-only tuple (HOT) của PostgreSQL. Vì vậy tài liệu PostgreSQL 16 khuyên xóa index ít hoặc không bao giờ được dùng[^pg-indexes-intro]. Oracle cũng ghi rằng nhiều index trên một bảng làm DML chậm đi[^ora-indexes]. Trong lab:

| Bảng | Số index | Chèn 200.000 dòng (3 lần) | Dung lượng sau lần cuối |
| --- | --- | --- | --- |
| `w0` | 0 | 240, 258, 204 ms | 18 MB |
| `w4` | 4 | 1.422, 1.272, 1.322 ms | 30 MB, trong đó 12 MB là index |

**Giá khi tạo index.** Tạo index trên bảng lớn có thể mất nhiều thời gian. Mặc định PostgreSQL 16 vẫn cho đọc song song nhưng chặn ghi tới khi tạo xong[^pg-indexes-intro]. Tùy chọn `CONCURRENTLY` không chặn ghi, đổi lại cần nhiều công hơn và lâu hơn đáng kể[^pg-createindex].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Index cột mà truy vấn lọc ra phần lớn bảng.** Planner có thể không bao giờ dùng nó, trong khi mọi lần ghi vẫn phải cập nhật nó. Dấu hiệu: `EXPLAIN` vẫn ra `Seq Scan` sau khi tạo index, như lọc `approved` trong lab.
- **Giữ index không ai dùng.** Dấu hiệu: cột `idx_scan` của `pg_stat_user_indexes` đứng yên qua thời gian dài. View này cho thống kê về việc truy cập từng index; thống kê tích lũy không cập nhật tức thì, nên đọc sau một khoảng thời gian chứ không ngay sau truy vấn[^pg-monitoring].
- **Thử index trên dữ liệu quá nhỏ.** Tài liệu PostgreSQL 16 gọi việc này là đặc biệt tai hại: lấy 1 trong 100 dòng khó là ứng viên cho index, vì 100 dòng đó có thể nằm gọn trong một trang. Tài liệu khuyên thử bằng dữ liệu thật[^pg-indexes-examine]. Dấu hiệu: index không được dùng trên máy dev nhưng lại cần trên production, hoặc ngược lại.
- **Xem kế hoạch mà chưa `ANALYZE`.** Tài liệu gọi việc xem xét cách dùng index mà chưa chạy `ANALYZE` là vô ích[^pg-indexes-examine]. Dấu hiệu: số dòng ước tính trong `EXPLAIN` lệch xa thực tế.
- **Tạo index thường trên bảng lớn đang nhận ghi.** Ghi bị chặn suốt thời gian tạo index[^pg-indexes-intro]. Dấu hiệu: các lệnh `INSERT`, `UPDATE` treo trong lúc migration chạy.

## Ví dụ thực tế

- [ex:lab-index-basics] — trên PostgreSQL 16.15, bảng 1.000.000 yêu cầu (88 MB), tìm 200 yêu cầu của một người gửi:
    - Chưa có index: `Parallel Seq Scan` với 2 worker, đọc 11.236 trang, 89,838 ms.
    - Tạo index trên `requester_id` mất 0,53 giây, index chiếm 6.728 kB. Sau đó: `Bitmap Index Scan` rồi `Bitmap Heap Scan`, đọc 203 trang, 0,410 ms.
    - Index trên `status`: lọc `pending` dùng index nhưng vẫn đọc cả 11.236 trang bảng, vì dòng pending rải khắp bảng; lọc `approved` thì planner quét tuần tự.
    - Chèn 200.000 dòng vào bảng có 4 index chậm hơn bảng không index từ 4,9 đến 6,5 lần tùy lượt, trong lần chạy này (bảng ở trên).
    - Thời gian là một lần đo trên máy build dùng chung; số trang ổn định hơn thời gian.

## Câu hỏi tự kiểm tra

- Không có index, PostgreSQL 16 làm gì để tìm 200 dòng trong 1 triệu dòng? Có index thì khác gì? Dẫn số trang trong lab.
- Vì sao planner dùng index khi lọc `pending` nhưng bỏ qua nó khi lọc `approved`? Theo Oracle, cột thế nào thì nên cân nhắc tạo index?
- Mỗi index làm thao tác ghi tốn thêm gì? Lab đo được gì, và khi nào nên xóa một index?
- Cần thêm index cho một bảng lớn đang nhận ghi liên tục. Lệnh `CREATE INDEX` thường gây ra gì, và lựa chọn kia đánh đổi điều gì?

## Chủ đề liên quan và nguồn kiểm chứng
