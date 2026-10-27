---
id: db-n-plus-one
title: Vấn đề N+1
parent: db-app
summary: Một truy vấn danh sách kéo theo N truy vấn con, cách phát hiện và sửa.
contentStatus: verified
volatility: slow
verifiedAt: 2026-10-15
verifiedBy: claude
prerequisites:
  - db-orm
related:
  - db-query-plan
  - db-index-basics
  - db-database-dbms
sources:
  - id: pg-query-path
    url: https://www.postgresql.org/docs/16/query-path.html
    title: "PostgreSQL 16 — 52.1. The Path of a Query"
    supports: "Ứng dụng gửi truy vấn tới máy chủ và chờ nhận kết quả; mỗi truy vấn qua các bước parser, rewrite, planner/optimizer, executor."
    product: PostgreSQL
    version: "16"
    checkedAt: 2026-10-14
  - id: rails-eager
    url: https://guides.rubyonrails.org/active_record_querying.html
    title: "Rails Guides 8.1.4 — Active Record Query Interface, Eager Loading Associations"
    supports: "Lấy 10 cuốn sách rồi đọc tác giả của từng cuốn chạy 1 + 10 = 11 truy vấn; includes(:author) chỉ còn 2 truy vấn, truy vấn thứ hai lấy tác giả với WHERE id IN (...); includes chọn giữa các truy vấn riêng và LEFT OUTER JOIN tùy truy vấn, ví dụ điều kiện dạng hash trên bảng liên quan tạo ra LEFT OUTER JOIN; với điều kiện viết bằng đoạn SQL phải dùng references."
    product: Ruby on Rails
    version: "8.1.4"
    checkedAt: 2026-10-15
examples:
  - id: lab-n1
    kind: lab-run
    title: "N+1, lấy theo lô và JOIN trên 20.000 yêu cầu, trước và sau khi có index (PostgreSQL 16.15)"
    path: lab/experiments/db-n-plus-one
    checkedAt: 2026-10-14
  - id: rails-n1
    kind: official-doc
    title: "Rails Guides 8.1.4: 11 truy vấn giảm còn 2 bằng includes"
    url: https://guides.rubyonrails.org/active_record_querying.html
    checkedAt: 2026-10-14
changelog:
  - date: 2026-10-14
    note: Claude soạn bản nháp đầu tiên và chạy thử nghiệm trên PostgreSQL 16.15.
  - date: 2026-10-14
    note: "Kiểm chứng: bỏ nhận định hiệu năng không đo (trang 20 so với 200 dòng); sửa mô tả includes của Rails (có thể dùng LEFT OUTER JOIN); giới hạn kết luận về JOIN vào đúng lab; thêm EXPLAIN cho câu đầu của cách IN; chạy lại lab và ghi rõ cách đo."
  - date: 2026-10-15
    note: "Phản biện vòng 2: thêm quy tắc hash/references của Rails 8.1.4 vào bài, ghi đúng truy vấn theo lô của lab (= ANY), viết lại câu hỏi 2 và 3 cho trả lời được từ bài."
  - date: 2026-10-15
    note: "Phản biện vòng 3: bỏ phần diễn giải ANY và IN không có nguồn, sửa tiêu đề ví dụ lab."
---

## Vấn đề cần giải quyết

Màn hình danh sách yêu cầu hiển thị 50 dòng, mỗi dòng có tên người gửi. Code tự nhiên nhất là lấy 50 yêu cầu, rồi với mỗi yêu cầu, lấy người gửi. Kết quả là 1 truy vấn cho danh sách cộng 50 truy vấn con: **N+1**.

ORM làm lỗi này khó thấy, vì truy vấn con chạy ngầm khi code truy cập một thuộc tính như `request.requester.name`. Rails Guides (Rails 8.1.4) mô tả đúng trường hợp này: lấy 10 cuốn sách rồi đọc tác giả từng cuốn tạo ra 11 truy vấn[^rails-eager].

## Cơ chế và luồng hoạt động

Với database chạy thành máy chủ riêng như PostgreSQL 16, ứng dụng gửi từng truy vấn tới máy chủ rồi chờ kết quả. Mỗi truy vấn lại đi qua các bước phân tích cú pháp, viết lại, lập kế hoạch và thực thi[^pg-query-path]. Với N+1, số lần làm trọn chu trình đó tăng tuyến tính theo số dòng trên trang.

Hai cách sửa:

1. **Lấy theo lô (2 truy vấn).** Lấy danh sách, gom các id liên quan, rồi lấy tất cả trong một truy vấn `WHERE id IN (...)`. Trong ví dụ của Rails Guides, `includes(:author)` làm đúng như vậy: 11 truy vấn còn 2[^rails-eager].
2. **Join (1 truy vấn).** Lấy danh sách và dữ liệu liên quan trong cùng một câu lệnh. `includes` của Rails 8.1.4 tự chọn giữa hai cách tùy truy vấn. Ví dụ, khi có điều kiện dạng hash trên bảng liên quan, nó tạo một câu có `LEFT OUTER JOIN`. Cách viết điều kiện bằng `where` này chỉ chạy khi truyền vào một hash; với điều kiện viết bằng đoạn SQL, phải gọi thêm `references` để buộc join bảng liên quan[^rails-eager].

Một truy vấn không tự động nhanh hơn hai truy vấn; thời gian còn phụ thuộc kế hoạch thực thi. Trong lab, khi chưa có index cho `ORDER BY created_at`, câu join chậm hơn cách lấy theo lô.

## Điều kiện áp dụng, lợi ích và đánh đổi

- **Lấy theo lô** giữ mỗi truy vấn đơn giản, và không nhân bản dòng cha khi quan hệ là một-nhiều.
- **Join** ít lượt đi về nhất. Với quan hệ một-nhiều, mỗi dòng cha xuất hiện một lần cho mỗi dòng con trong kết quả. Kế hoạch thực thi cần được kiểm tra trên dữ liệu thật.
- **N+1 đôi khi chấp nhận được:** trang chi tiết một bản ghi với vài quan hệ, nơi N nhỏ và cố định.

Khuyến nghị theo tình huống: với màn hình danh sách, mặc định lấy quan hệ theo lô hoặc join. Sau đó xác nhận bằng log SQL (đếm số truy vấn) và `EXPLAIN ANALYZE` trên dữ liệu có kích thước gần thật.

## Lỗi thường gặp và dấu hiệu nhận biết

- **Truy cập quan hệ trong vòng lặp hiển thị.** Dấu hiệu: log SQL có một chuỗi truy vấn giống hệt nhau, chỉ khác giá trị tham số.
- **Số truy vấn mỗi trang tăng theo số dòng hiển thị.** Dấu hiệu: tăng kích thước trang thì số dòng log SQL tăng theo.
- **Thử với ít dữ liệu.** Trên máy dev có vài bản ghi, N+1 không lộ ra.
- **Sửa N+1 rồi bỏ quên kế hoạch thực thi.** Trong lab, chưa có index, cả câu join lẫn câu đầu của cách theo lô đều quét toàn bộ 20.000 dòng; câu join còn hash join cả 20.000 dòng trước khi lấy 50.

## Ví dụ thực tế

- [ex:lab-n1] — PostgreSQL 16.15, client Node.js v22.22.0 với `pg` 8.16.3, chạy localhost, 500 người dùng và 20.000 yêu cầu. Lấy 50 yêu cầu mới nhất kèm tên người gửi. Số trong bảng là trung bình 20 vòng sau 1 vòng khởi động, của một lần chạy:

    | Cách | Số truy vấn | Chưa có index `created_at` | Có index `created_at` |
    | --- | --- | --- | --- |
    | N+1 | 51 | 20,23 ms | 15,21 ms |
    | Theo lô (`where id = any($1)`) | 2 | 5,08 ms | 0,79 ms |
    | `JOIN` | 1 | 12,34 ms | 0,94 ms |

    - Chưa có index: `EXPLAIN ANALYZE` cho thấy câu đầu của cách theo lô quét toàn bộ 20.000 dòng rồi sắp xếp top-N. Câu join quét 20.000 dòng, hash join 20.000 dòng rồi mới sắp xếp lấy 50.
    - Có index: kế hoạch của câu join chuyển sang `Index Scan Backward` và `Nested Loop` (có `Memoize`) trên đúng 50 dòng.
    - Số thời gian thay đổi giữa các lần chạy; hãy so tỷ lệ. Lab chưa đo qua mạng, nơi mỗi truy vấn còn thêm một lượt đi về.
- [ex:rails-n1] — Rails Guides (Rails 8.1.4): `Book.limit(10)` rồi đọc `book.author` chạy 11 truy vấn; `Book.includes(:author).limit(10)` chạy 2[^rails-eager].

## Câu hỏi tự kiểm tra

- Màn hình hiển thị 50 yêu cầu, mỗi yêu cầu có tên người gửi và tên phòng ban. Viết code theo kiểu N+1 thì chạy bao nhiêu truy vấn? Sửa theo lô thì còn bao nhiêu?
- Trong lab, khi chưa có index, `EXPLAIN ANALYZE` của câu join cho thấy nó xử lý bao nhiêu dòng trước khi lấy 50? Sau khi thêm index, kế hoạch của câu join đổi thế nào, và điều đó giải thích số đo thời gian ra sao?
- Với Rails 8.1.4, khi nào `includes` sinh truy vấn riêng và khi nào sinh `LEFT OUTER JOIN`? Điều kiện viết bằng đoạn SQL cần thêm gì? Bạn xác nhận lựa chọn của ORM bằng cách nào trong log SQL?
- Khi nào bạn chấp nhận N+1?

## Chủ đề liên quan và nguồn kiểm chứng
