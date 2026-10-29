---
id: db-normalization
title: Normalization và denormalization
parent: db-relational
summary: Tách bảng để tránh dư thừa và bất thường khi cập nhật, và khi nào chấp nhận dư thừa.
contentStatus: verified
volatility: stable
verifiedAt: 2026-10-15
verifiedBy: claude
prerequisites:
  - db-tables-keys-constraints
related:
  - db-access-patterns
  - db-document
  - db-sql-nosql-terms
sources:
  - id: ms-normalization
    url: https://learn.microsoft.com/en-us/office/troubleshoot/access/database-normalization-description
    title: "Microsoft Learn — Description of the database normalization basics (Access 2013–2021)"
    supports: "Normalization tổ chức bảng và quan hệ để loại bỏ dư thừa và phụ thuộc không nhất quán; dữ liệu dư thừa tốn đĩa và gây khó bảo trì; đổi địa chỉ khách hàng dễ hơn khi nó chỉ nằm ở bảng Customers; quy tắc 1NF (ví dụ Vendor Code 1, Vendor Code 2), 2NF, 3NF; ví dụ Adv-Room phụ thuộc hàm vào Advisor; tuân thủ 3NF không phải lúc nào cũng thực tế vì nhiều bảng nhỏ có thể làm giảm hiệu năng hoặc vượt giới hạn file mở và bộ nhớ; nếu vi phạm ba quy tắc đầu, ứng dụng phải lường trước dữ liệu dư thừa và phụ thuộc không nhất quán; có thể chỉ áp 3NF cho dữ liệu thay đổi thường xuyên; nếu còn trường phụ thuộc thì thiết kế ứng dụng buộc người dùng kiểm lại mọi trường liên quan khi một trường thay đổi. Trang áp dụng cho Access 2013–2021."
    product: Microsoft Access
    version: "2013–2021"
    checkedAt: 2026-10-15
  - id: mongo-tx
    url: https://www.mongodb.com/docs/manual/core/transactions/
    title: "MongoDB Manual — Transactions (đường dẫn /manual/ theo bản hiện hành; 9.0 khi đối chiếu)"
    supports: "Với nhiều tình huống, mô hình denormalized (document và mảng lồng nhau) vẫn là tối ưu; nhúng dữ liệu vào một document khiến transaction nhiều document không cần cho nhiều trường hợp thực tế."
    product: MongoDB
    version: "9.0"
    checkedAt: 2026-10-15
examples:
  - id: lab-update-anomaly
    kind: lab-run
    title: "Đổi tên phòng ban: bảng gộp ra hai tên, bảng đã tách ra một tên"
    path: lab/experiments/db-normalization
    checkedAt: 2026-10-14
  - id: ms-vendor-code
    kind: official-doc
    title: "Microsoft: hai cột Vendor Code 1, Vendor Code 2 là nhóm lặp mà 1NF loại bỏ"
    url: https://learn.microsoft.com/en-us/office/troubleshoot/access/database-normalization-description
    checkedAt: 2026-10-14
  - id: ms-adv-room
    kind: official-doc
    title: "Microsoft: số phòng của cố vấn phụ thuộc vào cố vấn, không phụ thuộc vào sinh viên"
    url: https://learn.microsoft.com/en-us/office/troubleshoot/access/database-normalization-description
    checkedAt: 2026-10-14
changelog:
  - date: 2026-10-14
    note: Claude soạn bản nháp đầu tiên và chạy thử nghiệm trên PostgreSQL 16.15.
  - date: 2026-10-14
    note: "Kiểm chứng: bỏ ví dụ tự nghĩ (chuỗi danh sách người duyệt), thay bằng ví dụ Vendor Code và Adv-Room của Microsoft; ghi rõ nhận định hiệu năng là của tài liệu Access; bỏ khái quát về mọi document database; sửa câu hỏi về phụ thuộc bắc cầu."
  - date: 2026-10-15
    note: "Phản biện vòng 2: diễn giải 3NF bám ví dụ Adv-Room có nguồn, bỏ lý do denormalize không có nguồn, thêm lựa chọn có điều kiện của Microsoft và ghi rõ khuyến nghị là của bài."
  - date: 2026-10-15
    note: "Phản biện vòng 3: thêm yêu cầu đi kèm lựa chọn của Microsoft."
  - date: 2026-10-29
    note: "Đoạn áp quy tắc 3NF chuyển từ bài thực hành cũ sang bảng yêu cầu của lab; nhận định, nguồn và ví dụ không đổi."
  - date: 2026-10-29
    note: "Sau phản biện, viết lại đoạn đó để nối quy tắc 3NF với bảng yêu cầu và nêu thiết kế đã tách của lab (tên phòng ban chỉ nằm ở bảng departments); nhận định, nguồn và ví dụ không đổi."
  - date: 2026-10-29
    note: "Sửa câu chữ theo góp ý minor của vòng phản biện 29/10: đoạn đó không còn nói lab áp quy tắc 3NF, và hai dòng changelog trên được ghi lại cho sát thay đổi."
---

## Vấn đề cần giải quyết

Khi cùng một thông tin được lưu ở nhiều chỗ, mỗi lần thay đổi phải sửa giống hệt ở tất cả các chỗ đó. Sót một chỗ là dữ liệu mâu thuẫn với chính nó. Tài liệu Microsoft lấy ví dụ địa chỉ khách hàng: đổi địa chỉ dễ hơn khi nó chỉ nằm ở bảng Customers và không ở đâu khác[^ms-normalization].

Normalization là cách tổ chức bảng và quan hệ giữa chúng để loại bỏ dư thừa và phụ thuộc không nhất quán[^ms-normalization].

## Cơ chế và luồng hoạt động

Ba dạng chuẩn đầu tiên, theo cách diễn đạt giản lược của tài liệu Microsoft cho Access[^ms-normalization]:

1. **Dạng chuẩn 1 (1NF):** không có nhóm lặp trong một bảng; mỗi tập dữ liệu liên quan có bảng riêng và có primary key. Ví dụ của Microsoft: không dùng hai cột Vendor Code 1 và Vendor Code 2 để lưu nhà cung cấp của một mặt hàng.
2. **Dạng chuẩn 2 (2NF):** tập giá trị dùng chung cho nhiều bản ghi được tách thành bảng riêng, nối bằng foreign key; bản ghi chỉ phụ thuộc vào primary key của bảng (khóa ghép nếu cần).
3. **Dạng chuẩn 3 (3NF):** loại bỏ các cột không phụ thuộc vào khóa. Ví dụ của Microsoft: số phòng của cố vấn (Adv-Room) phụ thuộc vào cố vấn chứ không vào sinh viên, nên chuyển sang bảng Faculty.

Trong ví dụ đó, Microsoft ghi rằng Adv-Room phụ thuộc hàm vào cột Advisor[^ms-normalization], mà Advisor không phải khóa của bảng sinh viên. Nói cách khác, Adv-Room chỉ gắn với khóa một cách gián tiếp, qua một cột không phải khóa; đó là kiểu cột mà quy tắc 3NF loại ra. Áp quy tắc này vào bảng yêu cầu của lab ở mục Ví dụ: tên phòng ban phụ thuộc vào phòng ban của người gửi, không phụ thuộc trực tiếp vào yêu cầu, nên lưu tên phòng ban trong mỗi dòng yêu cầu tạo ra đúng loại bất thường mà lab ghi lại. Trong thiết kế đã tách của lab, tên chỉ nằm ở bảng `departments`; mỗi người dùng tham chiếu phòng ban của mình bằng id, còn mỗi yêu cầu tham chiếu người gửi.

**Denormalization**, theo cách bài này dùng chữ, là cố ý giữ dữ liệu lặp hoặc gộp bảng, ngược với các quy tắc trên. MongoDB 9.0 gọi mô hình document và mảng lồng nhau là mô hình denormalized[^mongo-tx]. Microsoft ghi rằng nếu vi phạm một trong ba quy tắc đầu, ứng dụng phải lường trước các vấn đề như dữ liệu dư thừa và phụ thuộc không nhất quán[^ms-normalization].

## Điều kiện áp dụng, lợi ích và đánh đổi

Normalize giúp mỗi sự thật nằm ở một chỗ, nên cập nhật chỉ sửa một dòng và constraint giữ được toàn vẹn. Dữ liệu dư thừa vừa tốn đĩa vừa gây khó bảo trì[^ms-normalization].

Đánh đổi là truy vấn phải join nhiều bảng hơn: ở lab, thiết kế đã tách cần hai join để lấy tên phòng ban của một yêu cầu. Tài liệu Microsoft cho Access 2013–2021 ghi rằng 3NF về lý thuyết là đáng làm nhưng không phải lúc nào cũng thực tế. Lý do tài liệu nêu: nhiều bảng nhỏ có thể làm giảm hiệu năng hoặc vượt giới hạn file mở và bộ nhớ[^ms-normalization]. Đó là nhận định về Access, không phải số đo trên database bạn dùng.

Với MongoDB 9.0, tài liệu ghi rằng với nhiều tình huống, mô hình denormalized (document và mảng lồng nhau) vẫn là tối ưu, và nhúng dữ liệu khiến transaction nhiều document không cần cho nhiều trường hợp thực tế[^mongo-tx]. Lựa chọn đúng phụ thuộc vào truy vấn ứng dụng cần chạy và mức chấp nhận dữ liệu lặp.

Microsoft nêu một lựa chọn có điều kiện: có thể chỉ áp 3NF cho dữ liệu thay đổi thường xuyên. Nếu vẫn còn trường phụ thuộc, hãy thiết kế ứng dụng buộc người dùng kiểm lại mọi trường liên quan khi một trường thay đổi[^ms-normalization].

Khuyến nghị của bài này (đây là cách làm bài đề xuất, không phải trích từ nguồn): với database quan hệ cho hệ thống nghiệp vụ, bắt đầu từ thiết kế đã normalize. Chỉ denormalize một chỗ cụ thể khi có số đo cho thấy join ở đó là vấn đề, và ghi rõ cơ chế giữ các bản sao khớp nhau.

## Lỗi thường gặp và dấu hiệu nhận biết

- **Bất thường khi cập nhật.** Sửa một giá trị lặp ở vài dòng mà không sửa hết. Dấu hiệu: khi bảng có cả mã và tên của một thực thể, `GROUP BY` theo mã ra nhiều tên khác nhau.
- **Nhóm lặp bằng nhiều cột.** Như Vendor Code 1, Vendor Code 2[^ms-normalization]. Dấu hiệu: thêm nhà cung cấp thứ ba phải thêm cột, và truy vấn "mặt hàng của nhà cung cấp X" phải kiểm tra từng cột.
- **Denormalize mà không có cơ chế đồng bộ.** Dấu hiệu: hai màn hình hiển thị hai giá trị khác nhau cho cùng một thứ.
- **Tách quá mức.** Mỗi giá trị nhỏ một bảng riêng mà không có lý do nghiệp vụ. Dấu hiệu: truy vấn đơn giản cần rất nhiều join.

## Ví dụ thực tế

- [ex:lab-update-anomaly] — trên PostgreSQL 16.15, bảng gộp lưu tên phòng ban trong từng yêu cầu. Đổi tên "Phòng Nhân sự" chỉ ở các yêu cầu của một nhân viên (`UPDATE 2`) khiến cùng một phòng ban có hai tên: 2 yêu cầu mang tên mới, 1 yêu cầu mang tên cũ. Ở thiết kế đã tách, một câu `update` sửa một dòng của `departments` (`UPDATE 1`) và cả 3 yêu cầu đều thấy tên mới.
- [ex:ms-vendor-code] — Microsoft dùng hai cột Vendor Code 1, Vendor Code 2 làm ví dụ nhóm lặp mà 1NF loại bỏ[^ms-normalization].
- [ex:ms-adv-room] — Microsoft dùng số phòng của cố vấn (Adv-Room) làm ví dụ cột vi phạm 3NF và chuyển nó sang bảng Faculty[^ms-normalization].

## Câu hỏi tự kiểm tra

- Trong bảng `requests(id, title, requester_email, department_name)`, cột nào phụ thuộc vào khóa `id` chỉ thông qua một cột không phải khóa? Tách lại thế nào?
- Ở lab, vì sao bảng gộp cho phép một phòng ban có hai tên, còn thiết kế đã tách thì không thể?
- Khi nào bạn chấp nhận lưu lặp `department_name` vào bảng yêu cầu? Cần thêm gì để giữ dữ liệu đúng, và cần đo gì trước khi quyết định?

## Chủ đề liên quan và nguồn kiểm chứng
