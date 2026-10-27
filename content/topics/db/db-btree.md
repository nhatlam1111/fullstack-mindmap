---
id: db-btree
title: B-tree
parent: db-storage
summary: Cấu trúc index phổ biến nhất trong database quan hệ và các truy vấn nó hỗ trợ.
contentStatus: draft
volatility: stable
prerequisites:
  - db-index-basics
related:
  - db-lsm-tree
  - db-query-plan
  - db-access-patterns
sources:
  - id: ora-indexes
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/indexes-and-index-organized-tables.html
    title: "Oracle AI Database Concepts — Indexes and Index-Organized Tables"
    supports: "B-tree (balanced tree) là loại index phổ biến nhất, là danh sách giá trị có thứ tự chia thành các khoảng, cho hiệu năng tốt với tìm chính xác và tìm theo khoảng; có branch block để tìm và leaf block lưu giá trị khóa; B-tree cân bằng vì mọi leaf block luôn ở cùng độ sâu nên lấy bản ghi ở đâu cũng tốn thời gian xấp xỉ nhau; chiều cao là số block đi từ root tới leaf; leaf block chứa mọi giá trị được index kèm rowid, sắp theo (key, rowid), và các leaf block liên kết đôi; tìm một giá trị trong index tốn n lần I/O với n là chiều cao; các kiểu quét index gồm full, fast full, range, unique, skip."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-16
  - id: pg-btree-impl
    url: https://www.postgresql.org/docs/16/btree-implementation.html
    title: "PostgreSQL 16 — 67.4. Implementation (B-Tree Indexes)"
    supports: "B-tree của PostgreSQL là cây nhiều tầng, mỗi tầng dùng được như danh sách liên kết đôi các trang; có một metapage ở vị trí cố định đầu file; trang lá ở tầng thấp nhất chứa tuple trỏ tới dòng của bảng, trang trong trỏ xuống tầng dưới; thường hơn 99% số trang là trang lá; thêm trang lá mới khi trang lá hiện có không chứa nổi tuple mới; khi trang gốc không chứa nổi downlink mới thì root page split tạo trang gốc mới ở tầng cao hơn, thêm một tầng; đổi giá trị của chỉ một cột thuộc một index trong UPDATE (không áp dụng được HOT) luôn cần tuple mới cho mọi index của bảng; bottom-up deletion được kích hoạt khi dự đoán sắp có page split do phiên bản cũ dồn lại; deduplication gộp các tuple trùng khóa thành một posting list tuple, khóa chỉ xuất hiện một lần kèm mảng TID đã sắp; deduplication diễn ra lười khi tuple mới không vừa trang lá và xóa tuple không giải phóng đủ chỗ; bật mặc định, tắt từng index bằng deduplicate_items; workload ghi nhiều với ít giá trị trùng chịu một chi phí nhỏ cố định; tắt deduplication thường không có ích; index INCLUDE và kiểu numeric, jsonb, float không dùng được deduplication."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-nbtree-readme
    url: https://github.com/postgres/postgres/blob/REL_16_STABLE/src/backend/access/nbtree/README
    title: "PostgreSQL source REL_16_STABLE — src/backend/access/nbtree/README"
    supports: "Mã nguồn B-tree của PostgreSQL cài đặt thuật toán B-tree đồng thời cao của Lehman và Yao (ACM TODS 1981); so với B-tree cổ điển, mỗi trang có thêm right-link trỏ sang trang anh em bên phải và một high key là cận trên của các khóa được phép trên trang; khi đi theo downlink, lượt tìm so khóa cần tìm với high key, nếu lớn hơn thì trang đã bị tách đồng thời và phải đi theo right-link sang phải, có thể lặp lại nếu trang bị tách nhiều lần; khi đi xuống các tầng trên, lượt quét index không phải giữ khóa hay pin trang nào."
    product: PostgreSQL
    version: "16 (nhánh REL_16_STABLE)"
    checkedAt: 2026-10-16
  - id: pg-pageinspect
    url: https://www.postgresql.org/docs/16/pageinspect.html
    title: "PostgreSQL 16 — F.25. pageinspect"
    supports: "pageinspect cho phép xem nội dung trang database ở mức thấp để gỡ lỗi, chỉ superuser dùng được; bt_metap trả thông tin metapage, bt_page_stats trả thông tin tóm tắt một trang, bt_page_items trả chi tiết các mục trên trang; mục đầu tiên trên mọi trang không phải ngoài cùng bên phải là high key, cận trên của mọi mục trên trang."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-index-types
    url: https://www.postgresql.org/docs/16/indexes-types.html
    title: "PostgreSQL 16 — 11.2. Index Types"
    supports: "B-tree xử lý truy vấn bằng và theo khoảng trên dữ liệu sắp được; planner cân nhắc B-tree khi cột có index nằm trong so sánh <, <=, =, >=, >; BETWEEN, IN, IS NULL, IS NOT NULL cũng dùng được; LIKE và ~ dùng được nếu mẫu là hằng và neo ở đầu chuỗi như col LIKE 'foo%', không dùng được với col LIKE '%bar'; nếu database không dùng C locale thì cần operator class đặc biệt; ILIKE và ~* chỉ dùng được khi mẫu bắt đầu bằng ký tự không phải chữ cái; B-tree cũng trả dữ liệu theo thứ tự, không phải lúc nào cũng nhanh hơn quét rồi sắp nhưng thường có ích; Hash chỉ xử lý so sánh bằng; CREATE INDEX mặc định tạo B-tree; GIN hợp với giá trị gồm nhiều thành phần như mảng; BRIN hiệu quả nhất với cột tương quan tốt với thứ tự vật lý của dòng."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
  - id: pg-indexes-opclass
    url: https://www.postgresql.org/docs/16/indexes-opclass.html
    title: "PostgreSQL 16 — 11.10. Operator Classes and Operator Families"
    supports: "text_pattern_ops, varchar_pattern_ops, bpchar_pattern_ops so sánh từng ký tự thay vì theo quy tắc collation của locale, hợp với truy vấn LIKE hoặc biểu thức chính quy POSIX khi database không dùng locale C chuẩn; muốn so sánh <, <=, >, >= dùng index thì cần thêm index với operator class mặc định vì các truy vấn đó không dùng được xxx_pattern_ops, còn so sánh bằng thì dùng được; có thể tạo nhiều index trên cùng cột với operator class khác nhau; dùng locale C thì không cần xxx_pattern_ops."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-16
examples:
  - id: lab-btree
    kind: lab-run
    title: "Soi cấu trúc B-tree của 1 triệu khóa bằng pageinspect, deduplication và LIKE theo tiền tố (PostgreSQL 16.15)"
    path: lab/experiments/db-btree
    checkedAt: 2026-10-16
changelog:
  - date: 2026-10-16
    note: "Claude soạn bài từ tài liệu PostgreSQL 16, mã nguồn PostgreSQL nhánh REL_16_STABLE, Oracle AI Database Release 26 và chạy thử nghiệm trên PostgreSQL 16.15."
---

## Vấn đề cần giải quyết

Bài Index cho thấy index giúp tìm 200 dòng trong 1 triệu dòng mà không quét cả bảng. Để làm được vậy, cấu trúc của index phải đáp ứng cùng lúc nhiều việc: tìm một giá trị, tìm theo khoảng, trả dữ liệu đã sắp xếp, và vẫn nhanh khi bảng liên tục được chèn thêm. B-tree là cấu trúc làm được những việc đó; nó là loại index phổ biến nhất trong database[^ora-indexes] và là loại `CREATE INDEX` tạo mặc định trên PostgreSQL 16[^pg-index-types].

## Cơ chế và luồng hoạt động

**Hình dạng của cây.** Tài liệu Oracle AI Database (Release 26) mô tả B-tree là một danh sách giá trị có thứ tự, chia thành các khoảng. Cây có hai loại block: branch block để tìm đường và leaf block lưu giá trị khóa. Leaf block chứa mọi giá trị được index kèm `rowid` để tìm ra dòng thật, sắp theo `(key, rowid)`[^ora-indexes]. PostgreSQL 16 gọi tương ứng là trang trong (internal page) và trang lá (leaf page): trang lá ở tầng thấp nhất chứa tuple trỏ tới dòng của bảng, trang trong trỏ xuống tầng dưới. Ngoài ra có một metapage ở vị trí cố định đầu file index[^pg-btree-impl].

**Cây luôn cân bằng.** Mọi leaf block luôn ở cùng độ sâu, nên lấy bản ghi ở đâu trong index cũng tốn thời gian xấp xỉ nhau. Chiều cao là số block phải đi qua từ gốc tới lá[^ora-indexes]. Phần lớn index là trang lá: tài liệu PostgreSQL 16 cho biết thường hơn 99% số trang là trang lá[^pg-btree-impl].

Lab soi index khóa chính của bảng 1 triệu yêu cầu bằng extension `pageinspect`:

| Tầng | Loại trang | Số trang | Số mục |
|---|---|---|---|
| 2 | gốc | 1 | 10 |
| 1 | trong | 10 | 2.742 |
| 0 | lá | 2.733 | 1.002.732 |

Một triệu khóa chỉ cần ba tầng, và 99,60% số trang là trang lá. Lý do là mỗi trang chứa được hàng trăm mục: chia từ bảng trên, trung bình khoảng 367 mục mỗi trang lá và 274 mục mỗi trang trong, nên mỗi tầng phía trên có ít trang hơn tầng dưới hàng trăm lần. Tầng lá có 1.002.732 mục chứ không phải đúng 1.000.000, vì mục đầu tiên trên mỗi trang không nằm ngoài cùng bên phải là high key của trang[^pg-pageinspect]: 2.733 trang lá thì có 2.732 high key.

**Tìm một khóa.** Lượt tìm đi từ gốc, ở mỗi tầng chọn nhánh có khoảng chứa khóa, xuống tới trang lá, rồi theo con trỏ sang bảng. Tài liệu Oracle nói tìm một giá trị trong index tốn n lần I/O, với n là chiều cao của B-tree[^ora-indexes]. Trong lab, tìm `id = 777777` đọc 4 trang, phù hợp với 3 trang index (một trang mỗi tầng) cộng 1 trang bảng.

**Quét theo khoảng và theo thứ tự.** Trên PostgreSQL 16, mỗi tầng của cây dùng được như một danh sách liên kết đôi các trang[^pg-btree-impl]; Oracle cũng mô tả các leaf block liên kết đôi[^ora-indexes]. Vì vậy sau khi tìm tới đầu khoảng, lượt quét chỉ việc đi dọc các trang lá, xuôi hoặc ngược. Lab: lấy 100 `id` liên tiếp đọc 6 trang; `order by id desc limit 5` dùng `Index Only Scan Backward` và đọc 4 trang.

**Các phép so sánh B-tree hỗ trợ.** Trên PostgreSQL 16, planner cân nhắc B-tree khi cột có index nằm trong so sánh `<`, `<=`, `=`, `>=`, `>`, và cả `BETWEEN`, `IN`, `IS NULL`, `IS NOT NULL`. `LIKE` dùng được nếu mẫu là hằng và neo ở đầu chuỗi (`col LIKE 'foo%'`), không dùng được với `col LIKE '%bar'`. B-tree cũng trả dữ liệu theo thứ tự đã sắp[^pg-index-types].

**Khi trang đầy: tách trang.** Trang lá không chứa nổi tuple mới thì PostgreSQL thêm trang lá mới. Khi đến lượt trang gốc không chứa nổi downlink mới, root page split tạo trang gốc mới ở tầng cao hơn, cây thêm một tầng[^pg-btree-impl]. Cây cao lên từ gốc nên mọi lá vẫn ở cùng độ sâu.

**Đọc đúng khi trang đang bị tách.** Mã nguồn B-tree của PostgreSQL cài đặt thuật toán của Lehman và Yao (1981). Mỗi trang có thêm right-link trỏ sang trang bên phải và một high key là cận trên của các khóa trên trang. Nếu lượt tìm tới một trang và thấy khóa cần tìm lớn hơn high key, trang đó vừa bị tách đồng thời, và lượt tìm đi theo right-link sang phải[^pg-nbtree-readme]. Nhờ vậy, khi đi xuống các tầng trên, lượt quét không phải giữ khóa trên trang nào[^pg-nbtree-readme].

**Deduplication: khóa trùng chỉ lưu một lần.** PostgreSQL 16 gộp các tuple trùng khóa thành một posting list tuple: giá trị khóa xuất hiện một lần, theo sau là mảng TID đã sắp trỏ tới các dòng. Việc gộp diễn ra lười, khi một tuple mới không vừa trang lá, và được bật mặc định[^pg-btree-impl]. Lab tạo hai index trên cột `status` (chỉ 3 giá trị): có deduplication thì 6.904 kB (863 trang), tắt bằng `deduplicate_items = off` thì 30 MB (3.803 trang).

## Điều kiện áp dụng, lợi ích và đánh đổi

- **Hợp với:** tìm bằng, tìm theo khoảng, sắp xếp, `LIKE` theo tiền tố[^pg-index-types]. Cây nông: lab có 1 triệu khóa mà chỉ 3 tầng.
- **Không hợp với:** `LIKE '%bar'`; `ILIKE` chỉ dùng được khi mẫu bắt đầu bằng ký tự không phải chữ cái[^pg-index-types]. Với các nhu cầu khác, PostgreSQL 16 có loại index khác: Hash chỉ cho so sánh bằng, GIN cho giá trị gồm nhiều thành phần như mảng, BRIN cho cột tương quan tốt với thứ tự vật lý của dòng[^pg-index-types].
- **Locale ảnh hưởng tới `LIKE`.** Nếu database không dùng locale C chuẩn, index mặc định không phục vụ `LIKE` theo tiền tố; cần index với `text_pattern_ops` (hoặc `varchar_pattern_ops`, `bpchar_pattern_ops`), loại so sánh từng ký tự thay vì theo quy tắc collation. Index `text_pattern_ops` lại không phục vụ `<`, `<=`, `>`, `>=`, nên có khi cần cả hai index trên cùng cột[^pg-indexes-opclass]. Lab chạy với collation `C.UTF-8` (libc) và thấy đúng như vậy.
- **Giá khi ghi.** Chèn có thể làm tách trang[^pg-btree-impl]. Trên PostgreSQL 16, với `UPDATE` không áp dụng được tối ưu HOT, đổi chỉ một cột thuộc một index cũng cần tuple mới cho mọi index của bảng[^pg-btree-impl]. PostgreSQL có bottom-up deletion để dọn các phiên bản cũ dồn lại trước khi chúng làm tách trang[^pg-btree-impl].
- **Deduplication có giá nhỏ.** Workload ghi nhiều mà ít giá trị trùng chịu một chi phí nhỏ cố định; dù vậy tài liệu cho biết tắt deduplication thường không có ích. Index `INCLUDE` và các kiểu như `numeric`, `jsonb`, `float4`, `float8` không dùng được deduplication[^pg-btree-impl].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Mong B-tree phục vụ `LIKE '%abc'`.** Mẫu không neo đầu chuỗi thì B-tree không giúp được[^pg-index-types]. Dấu hiệu: `Seq Scan` với `Filter: (title ~~ '%abc'::text)` dù cột đã có index.
- **Có index mà `LIKE 'abc%'` vẫn quét cả bảng.** Thường do database không dùng locale C[^pg-indexes-opclass]. Dấu hiệu (lab bước 5): `Parallel Seq Scan` với `Filter: (title ~~ ...)`, trong khi `title = ...` thì dùng index. Kiểm tra `datcollate` trong `pg_database`, rồi tạo index `text_pattern_ops`; kế hoạch chuyển thành `Index Scan` với điều kiện `~>=~` và `~<~`.
- **Thay index mặc định bằng index `text_pattern_ops`.** Dấu hiệu: `LIKE` nhanh lên nhưng truy vấn `where title > ...` hoặc `order by title` lại quét cả bảng hoặc phải sắp xếp[^pg-indexes-opclass].
- **Tắt deduplication không có lý do.** Dấu hiệu: index trên cột ít giá trị phình ra nhiều lần; lab: 30 MB so với 6.904 kB.
- **Đọc sai số mục khi soi trang bằng `pageinspect`.** Mục đầu tiên trên trang không ngoài cùng bên phải là high key, không trỏ tới dòng nào[^pg-pageinspect]. Dấu hiệu: tổng số mục ở tầng lá lớn hơn số dòng của bảng một chút.

## Ví dụ thực tế

- [ex:lab-btree] — trên PostgreSQL 16.15, bảng 1.000.000 yêu cầu:
    - `bt_metap` của index khóa chính: trang gốc là block 412, `level = 2`, tức ba tầng. Bảng số trang ở phần Cơ chế lấy từ `bt_page_stats`.
    - `where id = 777777`: `Index Scan`, 4 trang.
    - `where id between 500000 and 500099`: `Index Only Scan`, 100 dòng, 6 trang. Vì bảng vừa được nạp và chưa `VACUUM`, `Heap Fetches` là 100; bài Access pattern giải thích chỉ số này.
    - `order by id desc limit 5`: `Index Only Scan Backward`, 4 trang.
    - Index trên `status`: 6.904 kB có deduplication, 30 MB khi tắt.
    - Collation `C.UTF-8`: `LIKE 'Yêu cầu số 12345%'` quét song song cả bảng với index mặc định; với index `text_pattern_ops` thì thành `Index Scan`.

## Câu hỏi tự kiểm tra

- Vì sao B-tree của 1 triệu khóa trong lab chỉ có ba tầng, và tìm một khóa đọc bao nhiêu trang?
- B-tree hỗ trợ những phép so sánh nào? Kể hai điều kiện trong `WHERE` mà B-tree không giúp được.
- Khi trang gốc đầy, PostgreSQL làm gì, và vì sao sau đó mọi trang lá vẫn ở cùng độ sâu?
- Trong lab, vì sao `LIKE 'Yêu cầu số 12345%'` không dùng index mặc định, và vì sao không nên xóa index mặc định sau khi tạo index `text_pattern_ops`?
- Deduplication làm gì, và vì sao index trên `status` giảm từ 30 MB xuống 6.904 kB?

## Chủ đề liên quan và nguồn kiểm chứng
