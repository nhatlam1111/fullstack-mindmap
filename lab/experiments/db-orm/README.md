# Thử nghiệm: db-orm

**Câu hỏi.** TypeORM sinh ra những câu SQL nào cho các thao tác thường gặp, và thao tác nào tốn nhiều câu hơn ta nghĩ?

**Môi trường.** PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2) trong container `postgres:16` của lab, Docker Desktop trên máy Lam (Windows 11); client Node.js v25.2.1 với driver `pg` 8.16.3, TypeORM 1.1.2. Chạy ngày 02/11/2026.

**Chạy lại.**

```bash
cd lab
docker compose up -d postgres   # hoặc PostgreSQL 16 có sẵn: đặt PGPORT (và PGUSER, PGPASSWORD, PGDATABASE nếu khác lab) cho khớp
npm install
node experiments/db-orm/run.mjs
```

**Kết luận từ kết quả dưới đây.**

- `findOneBy` sinh một câu `SELECT` liệt kê mọi cột của entity, có alias.
- Không khai báo `relations` thì `r.requester` là `undefined`, không có câu SQL nào được chạy thêm.
- Vòng lặp gọi `findOne` kèm `relations` cho từng dòng: 11 câu SQL cho 5 dòng, vì mỗi `findOne` kèm `relations` sinh 2 câu (`SELECT DISTINCT` rồi `SELECT`).
- `find` kèm `relations` trên cả danh sách: 1 câu có JOIN.
- `relationLoadStrategy: 'query'`: 3 câu không JOIN giữa danh sách và người gửi trong câu đầu.
- `save()` trên entity đã nạp, đổi một cột: 4 câu gồm `SELECT`, `START TRANSACTION`, `UPDATE` chỉ cột đã đổi, `COMMIT`.
- `save()` khi không có gì đổi: 1 câu `SELECT`, không có `UPDATE`.
- `update()`: 1 câu `UPDATE`.
- `count(*)` qua QueryBuilder trả chuỗi (`"2"`), vì driver trả `int8` là chuỗi.
- `db.query` với SQL viết tay truyền tham số riêng (`$1`).

**Giới hạn của kết luận.**

- Chỉ thử TypeORM 1.1.2 với cấu hình trên; ORM khác sinh SQL khác.
- Entity khai báo bằng `EntitySchema`, không dùng decorator; SQL sinh ra có thể khác nếu cấu hình khác.
- Dữ liệu chỉ có 5 dòng: lab đếm số câu SQL, không đo thời gian.
- Không thử lazy relation, cascade hay migration của TypeORM.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# ORM (TypeORM) trên PostgreSQL
Máy chủ: PostgreSQL 16.15 (Debian 16.15-1.pgdg13+2) on x86_64-pc-linux-gnu, compiled by gcc (Debian 14.2.0-19) 14.2.0, 64-bit
Isolation mặc định: read committed
Client: Node.js v25.2.1, driver pg 8.16.3
Thời điểm chạy: 2026-11-02T03:15:07.742Z
TypeORM: 1.1.2
[A]    49ms  NOTICE: schema "exp_orm" does not exist, skipping
   SQL 1: SELECT version()
   SQL 2: SELECT * FROM current_schema()

## 1. find theo khóa chính
   SQL 1: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id" FROM "exp_orm"."requests" "Request" WHERE (("Request"."id" = $1)) LIMIT 1  -- tham số: [1]
   kết quả: {"id":1,"title":"Yêu cầu 1","status":"pending"}

## 2. Không khai báo relations thì quan hệ không được nạp
   SQL 1: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id" FROM "exp_orm"."requests" "Request" WHERE (("Request"."id" = $1)) LIMIT 1  -- tham số: [1]
   r.requester = undefined

## 3. Lặp qua danh sách rồi nạp người gửi từng dòng: N+1 câu SQL
   SQL 1: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id" FROM "exp_orm"."requests" "Request" ORDER BY "Request"."id" ASC
   SQL 2: SELECT DISTINCT "distinctAlias"."Request_id" AS "ids_Request_id" FROM (SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id", "Request__Request_requester"."id" AS "Request__Request_requester_id", "Request__Request_requester"."name" AS "Request__Request_requester_name" FROM "exp_orm"."requests" "Request" LEFT JOIN "exp_orm"."users" "Request__Request_requester" ON "Request__Request_requester"."id"="Request"."requester_id" WHERE (("Request"."id" = $1))) "distinctAlias" ORDER BY "Request_id" ASC LIMIT 1  -- tham số: [1]
   SQL 3: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id", "Request__Request_requester"."id" AS "Request__Request_requester_id", "Request__Request_requester"."name" AS "Request__Request_requester_name" FROM "exp_orm"."requests" "Request" LEFT JOIN "exp_orm"."users" "Request__Request_requester" ON "Request__Request_requester"."id"="Request"."requester_id" WHERE ( (("Request"."id" = $1)) ) AND ( "Request"."id" IN (1) )  -- tham số: [1]
   SQL 4: SELECT DISTINCT "distinctAlias"."Request_id" AS "ids_Request_id" FROM (SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id", "Request__Request_requester"."id" AS "Request__Request_requester_id", "Request__Request_requester"."name" AS "Request__Request_requester_name" FROM "exp_orm"."requests" "Request" LEFT JOIN "exp_orm"."users" "Request__Request_requester" ON "Request__Request_requester"."id"="Request"."requester_id" WHERE (("Request"."id" = $1))) "distinctAlias" ORDER BY "Request_id" ASC LIMIT 1  -- tham số: [2]
   SQL 5: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id", "Request__Request_requester"."id" AS "Request__Request_requester_id", "Request__Request_requester"."name" AS "Request__Request_requester_name" FROM "exp_orm"."requests" "Request" LEFT JOIN "exp_orm"."users" "Request__Request_requester" ON "Request__Request_requester"."id"="Request"."requester_id" WHERE ( (("Request"."id" = $1)) ) AND ( "Request"."id" IN (2) )  -- tham số: [2]
   SQL 6: SELECT DISTINCT "distinctAlias"."Request_id" AS "ids_Request_id" FROM (SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id", "Request__Request_requester"."id" AS "Request__Request_requester_id", "Request__Request_requester"."name" AS "Request__Request_requester_name" FROM "exp_orm"."requests" "Request" LEFT JOIN "exp_orm"."users" "Request__Request_requester" ON "Request__Request_requester"."id"="Request"."requester_id" WHERE (("Request"."id" = $1))) "distinctAlias" ORDER BY "Request_id" ASC LIMIT 1  -- tham số: [3]
   SQL 7: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id", "Request__Request_requester"."id" AS "Request__Request_requester_id", "Request__Request_requester"."name" AS "Request__Request_requester_name" FROM "exp_orm"."requests" "Request" LEFT JOIN "exp_orm"."users" "Request__Request_requester" ON "Request__Request_requester"."id"="Request"."requester_id" WHERE ( (("Request"."id" = $1)) ) AND ( "Request"."id" IN (3) )  -- tham số: [3]
   SQL 8: SELECT DISTINCT "distinctAlias"."Request_id" AS "ids_Request_id" FROM (SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id", "Request__Request_requester"."id" AS "Request__Request_requester_id", "Request__Request_requester"."name" AS "Request__Request_requester_name" FROM "exp_orm"."requests" "Request" LEFT JOIN "exp_orm"."users" "Request__Request_requester" ON "Request__Request_requester"."id"="Request"."requester_id" WHERE (("Request"."id" = $1))) "distinctAlias" ORDER BY "Request_id" ASC LIMIT 1  -- tham số: [4]
   SQL 9: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id", "Request__Request_requester"."id" AS "Request__Request_requester_id", "Request__Request_requester"."name" AS "Request__Request_requester_name" FROM "exp_orm"."requests" "Request" LEFT JOIN "exp_orm"."users" "Request__Request_requester" ON "Request__Request_requester"."id"="Request"."requester_id" WHERE ( (("Request"."id" = $1)) ) AND ( "Request"."id" IN (4) )  -- tham số: [4]
   SQL 10: SELECT DISTINCT "distinctAlias"."Request_id" AS "ids_Request_id" FROM (SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id", "Request__Request_requester"."id" AS "Request__Request_requester_id", "Request__Request_requester"."name" AS "Request__Request_requester_name" FROM "exp_orm"."requests" "Request" LEFT JOIN "exp_orm"."users" "Request__Request_requester" ON "Request__Request_requester"."id"="Request"."requester_id" WHERE (("Request"."id" = $1))) "distinctAlias" ORDER BY "Request_id" ASC LIMIT 1  -- tham số: [5]
   SQL 11: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id", "Request__Request_requester"."id" AS "Request__Request_requester_id", "Request__Request_requester"."name" AS "Request__Request_requester_name" FROM "exp_orm"."requests" "Request" LEFT JOIN "exp_orm"."users" "Request__Request_requester" ON "Request__Request_requester"."id"="Request"."requester_id" WHERE ( (("Request"."id" = $1)) ) AND ( "Request"."id" IN (5) )  -- tham số: [5]
   tổng số câu SQL: 11

## 4. Khai báo relations trên truy vấn danh sách: một câu có JOIN
   SQL 1: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id", "Request__Request_requester"."id" AS "Request__Request_requester_id", "Request__Request_requester"."name" AS "Request__Request_requester_name" FROM "exp_orm"."requests" "Request" LEFT JOIN "exp_orm"."users" "Request__Request_requester" ON "Request__Request_requester"."id"="Request"."requester_id" ORDER BY "Request"."id" ASC
   số dòng: 5, người gửi dòng đầu: Người 2; tổng số câu SQL: 1

## 5. relationLoadStrategy = query: tách thành nhiều câu
   SQL 1: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id" FROM "exp_orm"."requests" "Request" ORDER BY "Request"."id" ASC
   SQL 2: SELECT "User"."id" AS "User_id", "User"."name" AS "User_name" FROM "exp_orm"."users" "User" INNER JOIN "exp_orm"."requests" "Request" ON "Request"."requester_id" = "User"."id" WHERE "Request"."id" IN ($1, $2, $3, $4, $5)  -- tham số: [1,2,3,4,5]
   SQL 3: SELECT "Request"."id" AS "Request_id", "Request"."requester_id" AS "User_requester_id" FROM "exp_orm"."requests" "Request" WHERE "Request"."id" IN (1, 2, 3, 4, 5)
   tổng số câu SQL: 3

## 6. save() trên entity đã nạp, đổi một cột
   SQL 1: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id" FROM "exp_orm"."requests" "Request" WHERE (("Request"."id" = $1)) LIMIT 1  -- tham số: [2]
   SQL 1: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id" FROM "exp_orm"."requests" "Request" WHERE "Request"."id" = $1  -- tham số: [2]
   SQL 2: START TRANSACTION
   SQL 3: UPDATE "exp_orm"."requests" SET "status" = $1 WHERE "id" = $2  -- tham số: ["approved",2]
   SQL 4: COMMIT
   tổng số câu SQL của save(): 4

## 7. save() khi không có gì đổi
   SQL 1: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id" FROM "exp_orm"."requests" "Request" WHERE (("Request"."id" = $1)) LIMIT 1  -- tham số: [2]
   SQL 1: SELECT "Request"."id" AS "Request_id", "Request"."title" AS "Request_title", "Request"."status" AS "Request_status", "Request"."requester_id" AS "Request_requester_id" FROM "exp_orm"."requests" "Request" WHERE "Request"."id" = $1  -- tham số: [2]
   tổng số câu SQL của save(): 1

## 8. update(): một câu UPDATE, không nạp entity
   SQL 1: UPDATE "exp_orm"."requests" SET "status" = $1 WHERE "id" = $2  -- tham số: ["approved",3]
   tổng số câu SQL: 1

## 9. QueryBuilder chỉ lấy cột cần và đếm theo nhóm
   SQL 1: SELECT "r"."status" AS "status", count(*) AS "so_dong" FROM "exp_orm"."requests" "r" GROUP BY "r"."status" ORDER BY "r"."status" ASC
   kết quả: [{"status":"approved","so_dong":"2"},{"status":"pending","so_dong":"3"}]

## 10. Câu SQL viết tay qua ORM vẫn truyền tham số riêng
   SQL 1: select name from exp_orm.users where id = $1  -- tham số: [1]
   kết quả: [{"name":"Người 1"}]
[A]   190ms  NOTICE: drop cascades to 2 other objects
   DETAIL: drop cascades to table exp_orm.users
drop cascades to table exp_orm.requests
-- Kết nối dùng chung driver pg qua pool của TypeORM. Số dòng users: 5, requests: 5.
```
