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
    supports: "save: entity đã có trong database thì được update, chưa có thì được insert. update: cập nhật entity theo id, các id hoặc điều kiện, đặt các trường từ partial entity. findOne: tìm entity đầu tiên khớp FindOptions; findOneBy: tìm entity đầu tiên khớp FindOptionsWhere. query: chạy một câu SQL thô."
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
---

## Vấn đề cần giải quyết

Code ứng dụng làm việc với object, database làm việc với bảng và dòng. Viết tay mọi câu SQL rồi tự chép từng cột sang object thì lặp lại rất nhiều. ORM (object-relational mapping) tự làm việc ánh xạ đó: bạn khai báo object tương ứng với bảng nào, rồi gọi phương thức thay vì viết SQL.

Cái giá là SQL trở nên khuất tầm mắt. Một dòng code có thể sinh một câu SQL, hoặc 2, hoặc N+1. Muốn dùng ORM mà không gặp bất ngờ, bạn phải biết nó sinh ra gì. Bài này dùng TypeORM vì bài thực hành dùng NestJS và TypeScript; ORM khác sinh SQL khác, nhưng cách kiểm tra thì giống nhau.

## Cơ chế và luồng hoạt động

**Ánh xạ.** Một entity khai báo bảng, các cột và quan hệ. TypeORM gọi xuống driver, nên mọi điều trong bài Driver và client vẫn đúng: lab thấy `count(*)` qua QueryBuilder trả `"2"` dạng chuỗi, vì driver trả `int8` là chuỗi.

**Hai kiểu tổ chức code.** Active Record đặt phương thức truy vấn trong chính model, đơn giản và hợp với app nhỏ. Data Mapper đặt chúng trong repository riêng, dễ bảo trì hơn ở app lớn[^typeorm-patterns].

**Đọc: TypeORM sinh gì.** Lab bật ghi log và đếm từng câu SQL, trên 5 dòng `requests` và 5 dòng `users`:

| Thao tác | Số câu SQL | Ghi chú |
|---|---|---|
| `findOneBy({ id })` | 1 | `SELECT` liệt kê mọi cột, có alias |
| `findOneBy` rồi đọc `r.requester` | 1 | `r.requester` là `undefined`, không có truy vấn thêm |
| `find` rồi `findOne` kèm `relations` cho từng dòng | 11 | 1 câu danh sách, mỗi `findOne` 2 câu |
| `find` kèm `relations` | 1 | một câu có JOIN |
| `find` kèm `relations`, `relationLoadStrategy: 'query'` | 3 | các câu riêng, không JOIN giữa danh sách và người gửi trong câu đầu |

`relations` là các quan hệ cần nạp cùng entity chính; `relationLoadStrategy` mặc định là `join`, còn `query` dùng các câu truy vấn riêng[^typeorm-find]. Dòng thứ ba chính là N+1 (xem bài N+1), và trong TypeORM 1.1.2 nó còn nặng hơn vì mỗi `findOne` kèm `relations` trong lab sinh 2 câu: một câu `SELECT DISTINCT` rồi một câu lấy dữ liệu.

**Ghi: TypeORM sinh gì.** Tài liệu ghi `save` update nếu entity đã có, insert nếu chưa có[^typeorm-repo]. Muốn biết thế thì lab cho thấy nó phải đọc trước:

| Thao tác | Số câu SQL | Các câu |
|---|---|---|
| `save()` sau khi đổi một cột | 4 | `SELECT`, `START TRANSACTION`, `UPDATE` chỉ cột đã đổi, `COMMIT` |
| `save()` khi không có gì đổi | 1 | `SELECT`, không có `UPDATE` |
| `update({ id }, { status })` | 1 | `UPDATE` |

`save()` tự mở transaction riêng của nó. Nếu bạn cần nhiều thao tác trong một transaction thì phải tự đặt ranh giới (xem bài Ranh giới transaction).

**Khi ORM không đủ.** QueryBuilder viết được truy vấn gộp nhóm, chỉ lấy cột cần. `query` chạy SQL thô[^typeorm-repo]; lab truyền tham số riêng (`$1`), không ghép chuỗi (xem bài Parameter binding).

## Điều kiện áp dụng, lợi ích và đánh đổi

**Lợi ích.**

- Giảm code lặp cho các thao tác đọc ghi thường gặp.
- Giá trị được truyền qua tham số: `UPDATE` trong lab có `$1`, `$2`.
- `save()` trong lab chỉ cập nhật cột đã đổi, và không ghi gì khi không có gì đổi.

**Đánh đổi.**

- **SQL khuất tầm mắt.** Một vòng lặp vô hại trong code thành 11 câu SQL.
- **Lấy mọi cột.** `findOneBy` trong lab liệt kê mọi cột của entity. Với cột lớn, dùng tùy chọn `select` để chỉ lấy thuộc tính cần[^typeorm-find].
- **Đọc trước khi ghi.** `save()` tốn thêm một `SELECT`. `update()` chỉ một câu, nhưng không qua logic của entity đã nạp.
- **Truy vấn phức tạp.** Báo cáo gộp nhóm, truy vấn nhiều join hay cần tối ưu theo kế hoạch thực thi thường dễ viết và dễ đọc hơn bằng SQL.

**Khi nào không nên dùng ORM cho một thao tác.** Khi cần kiểm soát chính xác SQL: báo cáo, cập nhật hàng loạt, truy vấn đã tối ưu bằng `EXPLAIN`. Dùng QueryBuilder hoặc SQL thô cho riêng các chỗ đó; ORM và SQL thô cùng tồn tại trong một dự án được, như lab bước 9 và 10.

## Lỗi thường gặp và dấu hiệu nhận biết

- **Không bật log SQL khi phát triển.** Dấu hiệu: bạn không trả lời được một endpoint chạy bao nhiêu câu SQL.
- **Nạp quan hệ trong vòng lặp.** Dấu hiệu: số câu SQL tăng theo số dòng. Lab: 11 câu cho 5 dòng, so với 1 câu khi khai báo `relations` ở truy vấn danh sách.
- **Đọc quan hệ chưa nạp.** Dấu hiệu: `r.requester` là `undefined` trong khi dữ liệu có thật trong database. Lab bước 2.
- **Dùng `save()` để cập nhật hàng loạt.** Dấu hiệu: mỗi dòng tốn một `SELECT` và một transaction. Lab bước 6 đo 4 câu cho một dòng; `update()` chỉ 1 câu.
- **Tin rằng số trả về từ `count(*)` là number.** Dấu hiệu: lab bước 9 trả `"so_dong":"2"`. Đổi kiểu trước khi tính (xem bài Driver và client).
- **Ghép chuỗi vào câu SQL thô.** Dấu hiệu: chuỗi SQL có giá trị từ người dùng nằm trong template string. Truyền qua tham số như lab bước 10.
- **Chỉ đọc code ORM khi truy vấn chậm.** Dấu hiệu: bạn sửa code mà không xem SQL thật. Lấy SQL từ log, rồi chạy `EXPLAIN` (xem bài Query plan và EXPLAIN).

## Ví dụ thực tế

- [ex:lab-orm] — TypeORM 1.1.2 trên PostgreSQL 16.15, 5 dòng `requests`, 5 dòng `users`:
    - Vòng lặp `findOne` kèm `relations`: 11 câu SQL; `find` kèm `relations`: 1 câu có JOIN; `relationLoadStrategy: 'query'`: 3 câu.
    - `save()` sau khi đổi `status`: `SELECT`, `START TRANSACTION`, `UPDATE "exp_orm"."requests" SET "status" = $1 WHERE "id" = $2`, `COMMIT`.
    - `save()` khi không đổi gì: 1 câu `SELECT`.
    - `update()`: 1 câu `UPDATE`.
    - QueryBuilder đếm theo nhóm: `{"status":"approved","so_dong":"2"}`.

## Câu hỏi tự kiểm tra

- Trong lab, vì sao vòng lặp qua 5 dòng tốn 11 câu SQL chứ không phải 6? Bạn sửa thế nào để còn 1 câu?
- `save()` và `update()` khác nhau thế nào về số câu SQL? Khi nào bạn chọn cái nào?
- Một endpoint chậm dùng ORM. Liệt kê các bước tìm nguyên nhân, bắt đầu từ việc xem SQL thật.
- `r.requester` là `undefined` dù dữ liệu có trong database. Vì sao, và sửa thế nào?
- Nêu một trường hợp bạn sẽ dùng SQL viết tay thay vì repository của ORM, và cách truyền tham số an toàn.

## Chủ đề liên quan và nguồn kiểm chứng
