---
id: db-orm
title: ORM
parent: db-app
summary: "Ánh xạ object và bảng: lợi ích, chi phí và các truy vấn ORM sinh ra."
contentStatus: draft
volatility: slow
prerequisites:
  - db-drivers
related:
  - db-n-plus-one
  - db-transaction-boundary
  - db-parameter-binding
  - db-query-plan
sources:
  - id: typeorm-repo
    url: https://typeorm.io/docs/working-with-entity-manager/repository-api/
    title: "TypeORM 1.x — Repository APIs"
    supports: "save: entity đã có trong database thì được update, chưa có thì được insert; lưu mọi entity truyền vào trong một transaction, mặc định có bật transaction. update: cập nhật entity theo id, các id hoặc điều kiện, đặt các trường từ partial entity. findOne: tìm entity đầu tiên khớp FindOptions; findOneBy: tìm entity đầu tiên khớp FindOptionsWhere. query: chạy một câu SQL thô."
    product: TypeORM
    version: "1.x (lab dùng 1.1.2)"
    checkedAt: 2026-11-02
  - id: typeorm-find
    url: https://typeorm.io/docs/working-with-entity-manager/find-options/
    title: "TypeORM 1.x — Find Options"
    supports: "relations là các quan hệ cần nạp cùng entity chính. relationLoadStrategy điều khiển cách nạp quan hệ: join (mặc định) dùng SQL JOIN, query dùng các câu truy vấn riêng. select chỉ ra các thuộc tính của object chính cần lấy."
    product: TypeORM
    version: "1.x (lab dùng 1.1.2)"
    checkedAt: 2026-11-02
  - id: typeorm-patterns
    url: https://typeorm.io/docs/guides/active-record-data-mapper/
    title: "TypeORM 1.x — Active Record vs Data Mapper"
    supports: "Active Record đặt mọi phương thức truy vấn trong chính model, giữ mọi thứ đơn giản và hợp với app nhỏ. Data Mapper đặt phương thức truy vấn trong các class riêng gọi là repository, giúp dễ bảo trì và hiệu quả hơn ở app lớn. Lựa chọn tùy người phát triển."
    product: TypeORM
    version: "1.x (lab dùng 1.1.2)"
    checkedAt: 2026-11-02
examples:
  - id: lab-orm
    kind: lab-run
    title: "Các câu SQL TypeORM 1.1.2 sinh ra cho find, relations, save, update trên PostgreSQL 16.15"
    path: lab/experiments/db-orm
    checkedAt: 2026-11-02
changelog:
  - date: 2026-11-02
    note: "Claude soạn bài từ tài liệu TypeORM 1.x và chạy thử nghiệm với TypeORM 1.1.2 trên PostgreSQL 16.15 trong Docker."
  - date: 2026-11-02
    note: "Phản biện vòng 1: tách rõ kết quả đếm giữa getRawMany và count(); thêm vào lab save() mảng, count(), cột int8 với hai cách khai báo; sửa lỗi về save() hàng loạt; bỏ ý không có căn cứ về update(); ghi các khuyến nghị là của bài; dùng đúng tên bài liên quan."
---

## Vấn đề cần giải quyết

Code ứng dụng làm việc với object, database làm việc với bảng và dòng. Viết tay mọi câu SQL rồi tự chép từng cột sang object thì lặp lại rất nhiều. ORM (object-relational mapping) tự làm việc ánh xạ đó: bạn khai báo object tương ứng với bảng nào, rồi gọi phương thức thay vì viết SQL.

Cái giá là SQL trở nên khuất tầm mắt. Một dòng code có thể sinh một câu SQL, hoặc 2, hoặc N+1. Muốn dùng ORM mà không gặp bất ngờ, bạn phải biết nó sinh ra gì. Bài này dùng TypeORM vì bài thực hành dùng NestJS và TypeScript; ORM khác sinh SQL khác, nhưng cách kiểm tra thì giống nhau.

## Cơ chế và luồng hoạt động

**Ánh xạ.** Một entity khai báo bảng, các cột và quan hệ. TypeORM gọi xuống driver, và thêm một lớp đổi kiểu của riêng nó, nên kết quả có thể khác bài Driver và client:

- Đọc `count(*)` thô qua QueryBuilder, tức bộ dựng câu truy vấn bằng code, với `getRawMany()`: `"2"` dạng chuỗi, như driver trả.
- `repository.count()` và `getCount()`: `number`.
- Cột `int8` khai báo `type: 'bigint'`: giữ chuỗi `9007199254740993`.
- Cột `int8` khai báo `type: Number`: `number` `9007199254740992`, tức bị làm tròn.

**Hai kiểu tổ chức code.** Active Record đặt phương thức truy vấn trong chính model, đơn giản và hợp với app nhỏ. Data Mapper đặt chúng trong repository riêng, dễ bảo trì hơn ở app lớn[^typeorm-patterns].

**Đọc: TypeORM sinh gì.** Lab bật ghi log và đếm từng câu SQL, trên 5 dòng `requests` và 5 dòng `users`:

| Thao tác | Số câu SQL | Ghi chú |
|---|---|---|
| `findOneBy({ id })` | 1 | `SELECT` liệt kê mọi cột, có alias |
| `findOneBy` rồi đọc `r.requester` | 1 | `r.requester` là `undefined`, không có truy vấn thêm |
| `find` rồi `findOne` kèm `relations` cho từng dòng | 11 | 1 câu danh sách, mỗi `findOne` 2 câu |
| `find` kèm `relations` | 1 | một câu có JOIN |
| `find` kèm `relations`, `relationLoadStrategy: 'query'` | 3 | một câu lấy danh sách, một câu lấy người gửi, một câu nối dòng với người gửi |

`relations` là các quan hệ cần nạp cùng entity chính; `relationLoadStrategy` mặc định là `join`, còn `query` dùng các câu truy vấn riêng[^typeorm-find]. Dòng thứ ba chính là N+1 (xem bài N+1), và trong TypeORM 1.1.2 nó còn nặng hơn vì mỗi `findOne` kèm `relations` trong lab sinh 2 câu: một câu `SELECT DISTINCT` rồi một câu lấy dữ liệu. N+1 ở đây đến từ vòng lặp viết tay: quan hệ trong lab không phải lazy nên đọc `r.requester` không tự sinh truy vấn. Lab chưa thử lazy relation.

**Ghi: TypeORM sinh gì.** Tài liệu ghi `save` update nếu entity đã có, insert nếu chưa có[^typeorm-repo]. Muốn biết thế thì lab cho thấy nó phải đọc trước:

| Thao tác | Số câu SQL | Các câu |
|---|---|---|
| `save()` sau khi đổi một cột | 4 | `SELECT`, `START TRANSACTION`, `UPDATE` chỉ cột đã đổi, `COMMIT` |
| `save()` khi không có gì đổi | 1 | `SELECT`, không có `UPDATE` |
| `save()` một mảng 5 entity đã đổi | 8 | `SELECT`, `START TRANSACTION`, 5 `UPDATE`, `COMMIT` |
| `update({ id }, { status })` | 1 | `UPDATE` |

Trong output, `SELECT` nằm ngoài transaction, và khi không có gì đổi thì không mở transaction. `save()` mặc định có bật transaction[^typeorm-repo]. Nếu bạn cần nhiều thao tác trong một transaction thì phải tự đặt ranh giới (xem bài Transaction boundary trong ứng dụng).

**Khi ORM không đủ.** QueryBuilder viết được truy vấn gộp nhóm, chỉ lấy cột cần. `query` chạy SQL thô[^typeorm-repo]; lab truyền tham số riêng (`$1`), không ghép chuỗi (xem bài Bind variable và SQL injection).

## Điều kiện áp dụng, lợi ích và đánh đổi

**Lợi ích.**

- Giảm code lặp cho các thao tác đọc ghi thường gặp.
- Giá trị trong các câu `UPDATE` của lab được truyền qua tham số (`$1`, `$2`). Riêng danh sách id ở các câu `SELECT` phụ, TypeORM ghi trực tiếp vào câu SQL (`IN (1, 2, 3, 4, 5)`).
- `save()` trong lab chỉ cập nhật cột đã đổi, và không ghi gì khi không có gì đổi.

**Đánh đổi.**

- **SQL khuất tầm mắt.** Một vòng lặp vô hại trong code thành 11 câu SQL.
- **Lấy mọi cột.** `findOneBy` trong lab liệt kê mọi cột của entity. Với cột lớn, dùng tùy chọn `select` để chỉ lấy thuộc tính cần[^typeorm-find].
- **Đọc trước khi ghi.** `save()` tốn thêm một `SELECT`; `update()` chỉ một câu `UPDATE`[^typeorm-repo].
- **Truy vấn phức tạp** (khuyến nghị của bài). Báo cáo gộp nhóm, truy vấn nhiều join hay cần tối ưu theo kế hoạch thực thi thường dễ viết và dễ đọc hơn bằng SQL.

**Khi nào không nên dùng ORM cho một thao tác** (khuyến nghị của bài). Khi cần kiểm soát chính xác SQL: báo cáo, cập nhật hàng loạt, truy vấn đã tối ưu bằng `EXPLAIN`. Dùng QueryBuilder hoặc SQL thô cho riêng các chỗ đó; ORM và SQL thô cùng tồn tại trong một dự án được, như lab bước 9 và 10.

## Lỗi thường gặp và dấu hiệu nhận biết

- **Không bật log SQL khi phát triển.** Dấu hiệu: bạn không trả lời được một endpoint chạy bao nhiêu câu SQL.
- **Nạp quan hệ trong vòng lặp.** Dấu hiệu: số câu SQL tăng theo số dòng. Lab: 11 câu cho 5 dòng, so với 1 câu khi khai báo `relations` ở truy vấn danh sách.
- **Đọc quan hệ chưa nạp.** Dấu hiệu: `r.requester` là `undefined` trong khi dữ liệu có thật trong database. Lab bước 2.
- **Gọi `save()` từng entity trong vòng lặp.** Dấu hiệu: mỗi dòng tốn một `SELECT` và một transaction; lab bước 6 đo 4 câu cho một dòng. `save()` một mảng gom được vào một transaction nhưng vẫn còn N câu `UPDATE` (lab bước 11).
- **Khai báo cột `int8` là `type: Number`.** Dấu hiệu: id lớn bị lệch. Lab bước 13: `9007199254740993` đọc ra `9007199254740992`, trong khi `type: 'bigint'` giữ đúng dưới dạng chuỗi.
- **Tin rằng `count(*)` thô là number.** Dấu hiệu: `getRawMany()` ở lab bước 9 trả `"so_dong":"2"`, trong khi `count()` ở bước 12 trả `number`. Đổi kiểu trước khi tính (xem bài Driver và client).
- **Ghép chuỗi vào câu SQL thô.** Dấu hiệu: chuỗi SQL có giá trị từ người dùng nằm trong template string. Truyền qua tham số như lab bước 10.
- **Chỉ đọc code ORM khi truy vấn chậm.** Dấu hiệu: bạn sửa code mà không xem SQL thật. Lấy SQL từ log, rồi chạy `EXPLAIN` (xem bài Query plan và EXPLAIN).

## Ví dụ thực tế

- [ex:lab-orm] — TypeORM 1.1.2 trên PostgreSQL 16.15, 5 dòng `requests`, 5 dòng `users`:
    - Vòng lặp `findOne` kèm `relations`: 11 câu SQL; `find` kèm `relations`: 1 câu có JOIN; `relationLoadStrategy: 'query'`: 3 câu.
    - `save()` sau khi đổi `status`: `SELECT`, `START TRANSACTION`, `UPDATE "exp_orm"."requests" SET "status" = $1 WHERE "id" = $2`, `COMMIT`.
    - `save()` khi không đổi gì: 1 câu `SELECT`.
    - `update()`: 1 câu `UPDATE`.
    - QueryBuilder đếm theo nhóm: `{"status":"approved","so_dong":"2"}`; `count()` và `getCount()` trả `number`.
    - `save()` một mảng 5 entity: 8 câu SQL.
    - Cột `int8`: `type: Number` đọc ra `9007199254740992`; `type: 'bigint'` giữ chuỗi `9007199254740993`.

## Câu hỏi tự kiểm tra

- Trong lab, vì sao vòng lặp qua 5 dòng tốn 11 câu SQL chứ không phải 6? Bạn sửa thế nào để còn 1 câu?
- `save()` và `update()` khác nhau thế nào về số câu SQL trong lab? Với 1.000 dòng cần đổi cùng một giá trị, bạn chọn cách nào, và vì sao?
- Một cột `int8` khai báo `type: Number` trong entity. Lab cho thấy gì, và bạn khai báo thế nào để an toàn?
- Một endpoint chậm dùng ORM. Liệt kê các bước tìm nguyên nhân, bắt đầu từ việc xem SQL thật.
- `r.requester` là `undefined` dù dữ liệu có trong database. Vì sao, và sửa thế nào?
- Nêu một trường hợp bạn sẽ dùng SQL viết tay thay vì repository của ORM, và cách truyền tham số an toàn.

## Chủ đề liên quan và nguồn kiểm chứng
