---
id: db-sql-nosql-terms
title: "SQL và NoSQL: tên gọi và phân loại"
parent: db-foundations
summary: SQL là ngôn ngữ, NoSQL là một nhóm cách tiếp cận; phân loại database theo nhiều chiều.
contentStatus: verified
volatility: slow
verifiedAt: 2026-10-15
verifiedBy: claude
prerequisites:
  - db-database-dbms
related:
  - db-choosing
  - db-consistency-models
  - db-normalization
sources:
  - id: ora-intro
    url: https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/introduction-to-oracle-database.html
    title: "Oracle AI Database Concepts — Introduction to Oracle AI Database"
    supports: "SQL là ngôn ngữ khai báo, làm việc theo tập hợp; là ngôn ngữ chuẩn ANSI cho database quan hệ."
    product: Oracle AI Database
    version: Release 26
    checkedAt: 2026-10-14
  - id: aws-nosql
    url: https://aws.amazon.com/nosql/
    title: "AWS — What is NoSQL?"
    supports: "NoSQL là viết tắt của 'not only SQL' hoặc 'non-SQL'; thường được dùng thay cho 'non-relational'; AWS liệt kê các loại key-value, document, graph, in-memory và search."
    product: AWS
    checkedAt: 2026-10-14
  - id: mongo-tx
    url: https://www.mongodb.com/docs/manual/core/transactions/
    title: "MongoDB Manual — Transactions (đường dẫn /manual/ theo bản hiện hành; 9.0 khi đối chiếu)"
    supports: "Thao tác trên một document là atomic; transaction nhiều document chạy trên replica set (FCV ≥ 4.0) và sharded cluster (FCV ≥ 4.2) với primary dùng WiredTiger; bảo đảm ACID theo read concern và write concern đã cấu hình; read concern 'local' trên sharded cluster không bảo đảm cùng snapshot giữa các shard; commit với w: 1 có thể bị rollback khi failover; transaction phân tán thường tốn hơn ghi một document và không thay được thiết kế schema tốt; với nhiều trường hợp, nhúng document khiến transaction nhiều document không cần thiết."
    product: MongoDB
    version: "9.0"
    checkedAt: 2026-10-15
  - id: ddb-consistency
    url: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html
    title: "Amazon DynamoDB Developer Guide — Read consistency"
    supports: "Eventually consistent là mặc định; GetItem, Query, Scan có tham số ConsistentRead; không hỗ trợ đọc strongly consistent từ global secondary index hay stream; đọc eventually consistent bằng một nửa chi phí; global table mặc định MREC là eventually consistent giữa các Region, chỉ MRSC mới cho đọc strongly consistent trả về bản mới nhất ở mọi replica."
    product: Amazon DynamoDB
    checkedAt: 2026-10-14
  - id: ddb-query-api
    url: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
    title: "Amazon DynamoDB API Reference — Query"
    supports: "Query một global secondary index với ConsistentRead = true sẽ nhận ValidationException; global secondary index chỉ hỗ trợ đọc eventually consistent."
    product: Amazon DynamoDB
    checkedAt: 2026-10-14
examples:
  - id: mongo-multi-doc-tx
    kind: official-doc
    title: "MongoDB 9.0: transaction nhiều document, kèm điều kiện triển khai và chi phí (đường dẫn /manual/ theo bản hiện hành; 9.0 khi đối chiếu)"
    url: https://www.mongodb.com/docs/manual/core/transactions/
    checkedAt: 2026-10-14
  - id: ddb-gsi-validation
    kind: official-doc
    title: "DynamoDB từ chối đọc strongly consistent trên global secondary index bằng ValidationException"
    url: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
    checkedAt: 2026-10-14
changelog:
  - date: 2026-10-14
    note: Claude soạn bản nháp đầu tiên từ tài liệu Oracle, MongoDB và DynamoDB.
  - date: 2026-10-14
    note: "Kiểm chứng: thêm nguồn cho định nghĩa NoSQL, nêu điều kiện transaction của MongoDB 9.0, sửa hành vi DynamoDB trên GSI (lỗi ValidationException), nói rõ bốn chiều là khung do bài đề xuất và các chiều phụ thuộc nhau, thêm global table."
  - date: 2026-10-15
    note: "Phản biện vòng 2: tách điều kiện có transaction khỏi mức bảo đảm, ghi rõ phạm vi NoSQL là theo AWS, thu hẹp câu hỏi 1."
  - date: 2026-10-15
    note: "Phản biện vòng 3: bỏ nhận định không có nguồn về nhà cung cấp khác, ghi rõ khuyến nghị là của bài, gắn cờ đường dẫn /manual/ cho ví dụ MongoDB."
---

## Vấn đề cần giải quyết

Câu hỏi "SQL hay NoSQL?" trộn hai thứ khác loại. SQL là một **ngôn ngữ**: ngôn ngữ khai báo, làm việc theo tập hợp, là chuẩn ANSI cho database quan hệ[^ora-intro]. NoSQL là viết tắt của "not only SQL" hoặc "non-SQL", và thường được dùng như một từ khác cho "non-relational"[^aws-nosql]. Đó là một nhãn chung, không phải ngôn ngữ hay chuẩn.

Theo trang giới thiệu NoSQL của AWS, nhóm này gồm cả in-memory database và search database, bên cạnh key-value, document và graph[^aws-nosql]. Khuyến nghị của bài này: khi gặp chữ NoSQL trong một tài liệu, xem người viết đang tính những loại database nào.

Khi chọn database theo nhãn, người ta dễ gán cho sản phẩm những tính chất nó không có, hoặc bỏ qua tính chất nó có.

## Cơ chế và luồng hoạt động

Bài này đề xuất mô tả một database theo bốn chiều thay vì một trục SQL/NoSQL. Đây là khung để đặt câu hỏi, không phải phân loại chuẩn.

| Chiều | Câu hỏi | Ví dụ giá trị |
| --- | --- | --- |
| Mô hình dữ liệu | Dữ liệu được tổ chức thành gì? | Bảng quan hệ, document, key-value, wide-column, graph |
| Workload | Hệ thống tối ưu cho việc gì? | Giao dịch (OLTP), phân tích (OLAP), time-series, tìm kiếm |
| Cách triển khai | Chạy trên một máy hay phân tán? | Một node, replica set, sharded cluster, dịch vụ quản lý sẵn |
| Khả năng truy vấn và bảo đảm | Hỏi được gì, bảo đảm gì? | Join, transaction nhiều bản ghi, mức consistency khi đọc |

Các chiều không độc lập. Cách triển khai thường quyết định bảo đảm nào có được, như hai ví dụ dưới đây.

**MongoDB 9.0.** Thao tác trên một document là atomic[^mongo-tx]. Transaction nhiều document chỉ có khi triển khai là replica set (featureCompatibilityVersion ≥ 4.0) hoặc sharded cluster (≥ 4.2), và primary dùng storage engine WiredTiger[^mongo-tx].

Có transaction rồi thì mức bảo đảm vẫn chưa cố định: MongoDB ghi rằng transaction cho atomicity, consistency, isolation và durability theo read concern và write concern đã cấu hình[^mongo-tx].

Hai hệ quả cụ thể từ tài liệu: trên sharded cluster, read concern `"local"` không bảo đảm các shard đọc cùng một snapshot; commit với `w: 1` có thể bị rollback khi failover[^mongo-tx]. MongoDB gọi transaction nhiều document là "distributed transaction", kể cả khi chạy trên replica set[^mongo-tx].

**Amazon DynamoDB.** Đọc mặc định là eventually consistent. `GetItem`, `Query`, `Scan` có tham số `ConsistentRead` để chọn đọc strongly consistent[^ddb-consistency]. Lựa chọn này phụ thuộc chỗ đọc:

- Trên global secondary index, `Query` với `ConsistentRead = true` bị từ chối bằng `ValidationException`[^ddb-query-api].
- Với global table ở chế độ mặc định (MREC), thay đổi là eventually consistent giữa các Region; chỉ chế độ MRSC mới cho đọc strongly consistent trả về bản mới nhất ở mọi replica[^ddb-consistency].

## Điều kiện áp dụng, lợi ích và đánh đổi

Mô tả theo nhiều chiều buộc bạn hỏi đúng câu: ứng dụng cần truy vấn gì, cần bảo đảm gì, chạy ở quy mô và cách triển khai nào. Đổi lại, bạn phải đọc tài liệu của từng sản phẩm và từng phiên bản thay vì dựa vào một quy tắc chung.

Ngay trong một sản phẩm, mỗi lựa chọn có giá:

- MongoDB 9.0 ghi rằng trong đa số trường hợp, transaction phân tán tốn hơn ghi một document, và không nên thay cho thiết kế schema tốt. Với nhiều trường hợp, nhúng document và mảng vào một document khiến transaction nhiều document không còn cần[^mongo-tx].
- DynamoDB tính đọc eventually consistent bằng một nửa chi phí đọc strongly consistent[^ddb-consistency].

## Lỗi thường gặp và dấu hiệu nhận biết

- **"NoSQL không có transaction."** Sai với MongoDB 9.0, vốn có transaction nhiều document khi triển khai đúng điều kiện[^mongo-tx]. Dấu hiệu: tự viết cơ chế bù trừ phức tạp cho việc database đã hỗ trợ.
- **"Có transaction là có ACID như nhau ở mọi cấu hình."** Trên MongoDB, bảo đảm phụ thuộc read concern và write concern; `w: 1` có thể mất commit khi failover[^mongo-tx]. Dấu hiệu: không ai trong nhóm biết ứng dụng đang dùng write concern nào.
- **"NoSQL luôn eventually consistent."** DynamoDB cho chọn đọc strongly consistent[^ddb-consistency]. Ngược lại, gọi `Query` trên global secondary index với `ConsistentRead = true` thì nhận lỗi `ValidationException`[^ddb-query-api]. Dấu hiệu: lỗi `ValidationException` khi chuyển một truy vấn đang dùng `ConsistentRead` sang global secondary index.
- **"NoSQL nhanh hơn SQL."** Câu này vô nghĩa nếu không nói workload, dữ liệu, cấu hình và cách đo. Dấu hiệu: một benchmark không ghi môi trường được dùng làm lý do chọn sản phẩm.

## Ví dụ thực tế

- [ex:mongo-multi-doc-tx] — tài liệu MongoDB 9.0: transaction nhiều document có thật, nhưng đi kèm điều kiện triển khai (replica set hoặc sharded cluster, WiredTiger), phụ thuộc read/write concern, và khuyến nghị về chi phí[^mongo-tx].
- [ex:ddb-gsi-validation] — tài liệu API của DynamoDB: query global secondary index với `ConsistentRead = true` trả về `ValidationException`, vì global secondary index chỉ hỗ trợ đọc eventually consistent[^ddb-query-api].

## Câu hỏi tự kiểm tra

- Với MongoDB 9.0 và DynamoDB, chiều "cách triển khai" (hoặc chỗ đọc dữ liệu) ràng buộc chiều "bảo đảm" như thế nào? Nêu một ràng buộc cụ thể cho mỗi sản phẩm.
- Vì sao không thể trả lời "database X có transaction không" chỉ từ nhãn SQL hay NoSQL? Cần hỏi thêm những gì về MongoDB?
- Một đồng nghiệp nói "dùng DynamoDB thì luôn đọc được dữ liệu mới nhất nếu bật ConsistentRead". Câu này sai ở những chỗ đọc nào?

## Chủ đề liên quan và nguồn kiểm chứng
