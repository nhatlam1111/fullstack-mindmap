# Phản biện chặng 4

Nhóm A: `db-drivers`, `db-orm`, `db-timeouts`.
Nhóm B: `aidev-repo-context`, `aidev-reviewing-ai-code`, `aidev-tests-as-guardrails`.
Nhóm tồn: các việc để lại từ chặng 3 (mục "Việc tồn cho chặng sau" trong `docs/reviews/chang-03.md`).

Mỗi vòng do một agent mới (Opus) thực hiện theo prompt ở `docs/kiem-chung.md`.

## Vòng 1 — 02/11/2026 — nhóm tồn
Bài: db-transaction-acid, db-query-plan, db-btree, db-lsm-tree, db-index-basics, db-joins, learn-practice-case, learn-lab, lab/README.md, lab/experiments/db-index-basics/README.md

Nguồn đã mở:
- pg-planner-stats, pg-btree-impl, rocksdb-bloom, ora-transactions, aca-pricing: mở được.
- pg-indexes-intro: mở được (đích của liên kết mới ở db-joins).
- myrocks-pvldb: mở được (tải PDF, trích bằng pdftotext, đọc đoạn về seek và prefix bloom filter).
- lab-readme: đọc lab/README.md ở HEAD.
- Mở thêm, bài không dẫn: PostgreSQL 16 contrib, CREATE ROLE, `table.h` của RocksDB tag v9.8.4: mở được.
- Trong repo:
  - output.txt và run.mjs của lab db-btree.
  - output.txt và run.mjs của lab db-transaction-acid.
  - Phần `create statistics` trong lab db-query-plan.
  - `run.py` của lab db-lsm-tree.
  - `lib/harness.mjs` và `lib/requests-1m.mjs`.
  - Thân db-schema-data-model và db-connection-pool.
- Không mở lại các nguồn có câu dẫn không đổi.

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| db-query-plan | 79 | minor | E15, E19 | Câu mới đúng mức với pg-planner-stats, nhưng làm mất ý mà minor vòng 1 yêu cầu: điều kiện trên cột phụ thuộc không thu hẹp thêm kết quả. Bài không còn nói vì sao planner ước tính thiếu. Câu hỏi dòng 121 ("nó cho planner biết điều gì") chỉ trả lời được ở mức "mức phụ thuộc". "Hệ số đó" cũng không có gì đứng trước, vì vế đầu chỉ nói "mức phụ thuộc". `supports` vẫn giữ ý đã bỏ. | Viết: "Với tùy chọn `dependencies`, `ANALYZE` đo mức một cột quyết định cột kia, thành một hệ số. Điều kiện trên cột phụ thuộc không thu hẹp thêm kết quả, nên với điều kiện bằng so với hằng và `IN`, planner dùng hệ số đó để không ước tính thiếu[^pg-planner-stats]." |
| db-lsm-tree | 104 | minor | B6, E19 | Bản cũ ("Khi đặt filter policy, mỗi file SST mới có…") đúng mức wiki. Bản mới thêm "chỉ", trong khi wiki chỉ nói đặt thì có, không nói không đặt thì không có. Ý này đúng (`table.h` v9.8.4: `filter_policy` mặc định `nullptr`), nhưng `table.h` không có trong `sources`, nên `[^rocksdb-bloom]` không đỡ trọn câu. Cụm "mới chỉ có" còn dễ đọc thành "hiện mới chỉ có". | Viết: "Khi bạn đặt filter policy, tức cấu hình cách tạo filter, mỗi file SST tạo mới có một Bloom filter; lab này không đặt." Hoặc thêm `table.h` vào `sources`. |
| learn-lab; lab/README.md | 175; 23 | minor | B6 | "Phải là superuser, vì có lab tạo extension và tạo role": chỉ vế extension cần superuser. Theo tài liệu contrib, `CREATE EXTENSION` cần superuser với extension không trusted, và `pageinspect`, `pgstattuple` không thuộc danh sách trusted. Theo tài liệu CREATE ROLE, quyền `CREATEROLE` là đủ để tạo role. Tôi kiểm trên `lab-postgres-1` (16.15) trong transaction đã rollback: role `NOSUPERUSER CREATEROLE` tạo được role, nhưng bị từ chối `create extension pageinspect`. Yêu cầu superuser vẫn là lời khuyên đủ an toàn cho cả bộ lab; chỉ lý do "tạo role" nói mạnh hơn nguồn. | lab/README.md: `db-btree`, `db-mvcc` cần superuser vì extension; `db-connection-pool`, `db-schema-data-model` cần `CREATEROLE` (`db-connection-pool` còn chạy `grant connect on database`). learn-lab: chỉ giữ lý do extension. |
| learn-lab | 175 | minor | E16, E19 | Câu superuser chen vào bullet về quên đặt cổng. "Role đó" không có danh từ nào đứng trước. "Dấu hiệu quên" ngay sau đó nay đọc thành quên superuser, trong khi `ECONNREFUSED` là dấu hiệu của quên cổng. Yêu cầu superuser không có dấu hiệu riêng, mà harness in lỗi rồi chạy tiếp (bài dòng 139), nên dễ bỏ sót. | Tách thành bullet riêng, kèm dấu hiệu lấy nguyên văn từ một lần chạy thật. psql trên 16.15 báo `permission denied to create extension "pageinspect"`; các bước sau trong output thiếu kết quả. |
| db-btree; db-query-plan; learn-lab | btree 27, 30; query-plan 30; learn-lab 22 | minor | B5, F | `supports` của pg-btree-impl không có ý `CREATE INDEX` áp dụng deduplication mà dòng 106 dẫn; hai `supports` còn lại đã cập nhật. `checkedAt` của ba nguồn không đổi dù nội dung dẫn là mới. Riêng lab-readme ghi 2026-10-29, nhưng câu superuser chỉ có từ commit 8d6f69b (02/11/2026). | Thêm ý vào `supports` của pg-btree-impl. Đặt `checkedAt: 2026-11-02` cho cả ba nguồn. |
| db-transaction-acid | 136 (cùng cụm ở 134) | minor | C11, E19 | run.mjs và output.txt không đánh số bước. "Bước một" trong output (dòng 36: "bước hai lỗi thì bước một cũng không còn") chỉ lệnh thứ nhất của thao tác duyệt, và bài dòng 114 cũng dùng "bước đầu" theo nghĩa đó. Câu này làm đúng đề xuất vòng trước; phép so sánh vẫn đúng với ora-transactions và output. | Viết "giống hệt phần đầu của lab trên PostgreSQL 16 (yêu cầu `approved`, 0 dòng lịch sử)". Sửa dòng 134 cho khớp. |

Tổng: 0 blocker, 0 major, 6 minor.

Ghi chú:
- **`npm run validate`:** 176 chủ đề (skeleton 146, draft 6, verified 24), 0 lỗi, 0 cảnh báo, không có gì liên quan tới các bài này. Cây làm việc vẫn sạch.
- **Việc tồn:** cả 11 việc thuộc phạm vi đều đã làm, phần còn góp ý nằm ở bảng trên. Hai việc đổi chữ trong `run.py` và `run.mjs` được bỏ qua theo ghi chú bối cảnh.
- **Không có phát hiện:** learn-practice-case, db-index-basics (bài và README lab), db-joins. Trang đích của liên kết mới ở db-joins có nội dung ở db-index-basics dòng 97, khớp pg-indexes-intro.
- **Số liệu khớp nguồn hoặc output:**
  - 6.904 kB và 863 trang; 30 MB và 3.803 trang.
  - 6 và 4 trang; `Heap Fetches` 100 và 5.
  - Ba lượt chèn của `w0` và `w4`, tỉ lệ 4,9–6,5 lần.
  - 180.000, 360.000, 2 triệu; 0,01 và 1.000.
- **Changelog:** 8 dòng mới mô tả đúng thay đổi. Đã so dòng 84, 86 của db-transaction-acid và dòng 78 của learn-practice-case với diff của 973dab2 và 3dacb3f; việc phân lại ý là đúng.
- **db-btree dòng 98:** đúng, không xếp thành phát hiện.
  - Output không đo vị trí dòng; ý này suy từ cách sinh dữ liệu (`requests-1m.mjs` chèn theo `generate_series`).
  - Phép tính phù hợp: 6 trang trừ 3 trang index còn 3 trang bảng, với khoảng 89 dòng mỗi trang.
  - Không mâu thuẫn với db-access-patterns dòng 125: ở đó các dòng nằm rải rác, nên 20 lần vào bảng tốn nhiều trang.
- **Ngoài phạm vi, không tính vào Tổng:** `D:\lam.nguyen\Projects\fullstack-mindmap\content\topics\learn\learn-lab.md` dòng 175 ghi "Cả 17 README lab PostgreSQL". Số này đúng ở 8d6f69b, nhưng từ b50e4ed đã có 20 lab dùng harness, cả 20 README đều có dòng gợi ý. Cần sửa trước release, ví dụ "Mọi README lab PostgreSQL". Dòng changelog 100 là lịch sử, giữ nguyên.
- **Kiểm thử:** thử quyền chạy trong `BEGIN … ROLLBACK` trên `lab-postgres-1`. Sau đó đã xác nhận không còn role tạm. Không sửa file nào trong repo.
- **Mức đọc nguồn:** các trang web đọc qua trích xuất của WebFetch, chỉ phần liên quan tới câu đã đổi; myrocks-pvldb chỉ đọc đoạn được dẫn.

### Xử lý

- Cả 6 minor giữ nguyên ở chặng này và chuyển sang nhóm tồn của chặng 5 (xem "Việc tồn cho chặng sau" cuối file): không minor nào làm sai nhận định chính của bài.
- Ghi chú ngoài bảng về `learn-lab` ("Cả 17 README"): đã sửa thành "Mọi README lab PostgreSQL", vì chặng 4 thêm 3 lab; câu này đi vào vòng 2 của nhóm B.

Kết luận vòng: sạch. Các bài giữ `verifiedAt` cũ, vì chỉ phần đã đổi được phản biện.

## Vòng 1 — 02/11/2026 — nhóm A
Bài: db-drivers, db-orm, db-timeouts

Nguồn đã mở:
- db-drivers: pg-protocol-overview: mở được; pg-protocol-flow: mở được; np-types: mở được; np-pg-types: mở được; np-client: mở được; oracledb-modes: mở được.
- db-orm: typeorm-repo: mở được; typeorm-find: mở được; typeorm-patterns: mở được.
- db-timeouts: pg-client-config: mở được; pg-protocol-flow: mở được; pg-signal: mở được; np-client: mở được; np-pool: mở được; aws-timeouts: mở được (url aws.amazon.com/builders-library chuyển 301 về đúng url trong bài).
- Giới hạn: WebFetch trả nội dung qua mô hình trích xuất, có giới hạn độ dài trích dẫn. Tôi so theo từng câu cần kiểm, chưa đọc văn bản thô toàn trang.
- Mở thêm để đối chiếu: `pg_dump.c` nhánh REL_16_STABLE, node-postgres Queries, PostgreSQL 17 runtime-config-client, `query.js` của tag `pg@8.16.3`. Tải được file `query.js`, nhưng trang tải về không ghi tag nên chưa xác nhận được tag tồn tại.

Validate: `npm run validate` cho `176 chủ đề (skeleton: 146, draft: 6, verified: 24) · 0 lỗi · 0 cảnh báo`. `output.txt` của cả 3 lab khớp khối "Kết quả thật" trong README.

Phép thử thêm của người phản biện: tôi chạy một script trong scratchpad trên container lab, bằng `pg` 8.16.3, `pg-pool` 3.14.0, TypeORM 1.1.2. Script dùng schema tạm `rv_tmp`, đã xóa (kiểm lại còn 0 schema). Không sửa file nào trong repo. Bài chưa được trích kết quả này vì chưa nằm trong `lab/experiments/`.

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| db-timeouts | 128 | blocker | B.6, C.11 | "`pg_dump` hay migration chạy lâu bị hủy với `57014`[^pg-client-config]". Nguồn chỉ nói đặt trong `postgresql.conf` "would affect all sessions", không nhắc pg_dump, migration hay 57014. Riêng pg_dump thì sai: `setup_connection` trong `pg_dump.c` (REL_16_STABLE) chạy `SET statement_timeout = 0`, cả `lock_timeout` và `idle_in_transaction_session_timeout`, nên giá trị chung không hủy được nó. | Bỏ pg_dump. Giữ migration thì ghi là suy luận của bài và bỏ `[^pg-client-config]` khỏi dấu hiệu, hoặc thêm bước lab. |
| db-timeouts | 87 | major | C.11, D.13 | Cột "Lỗi trong lab" của `connectionTimeoutMillis` ghi "lỗi từ pool", nhưng không lab nào dùng tham số này (`grep` trong `lab/experiments` ra 0 file). README cũng không ghi điều này ở mục giới hạn. | Đổi ô thành "không thử trong lab" và thêm vào mục giới hạn của README, hoặc thêm bước lab rồi ghi đúng thông báo lỗi. |
| db-timeouts | 130 | major | B.4, E.15, E.16 | "Với pool, cần xử lý sự kiện `error` của client đang nhàn rỗi" chỉ sai chỗ. Session nghỉ trong transaction là client đang được mượn, không phải client rảnh trong pool. `pg-pool` 3.14.0 gỡ `idleListener` khi cho mượn (`index.js:344`). Phép thử: `pool.connect()` + `begin`, session bị kết thúc thì `pool.on('error')` không chạy và Node ném `uncaughtException: 25P03 ...`. Bài db-connection-pool cũng chỉ nói về client rảnh, nên liên kết không giúp được. | Viết lại: client mượn từ pool mà giữ qua transaction thì gắn `client.on('error', ...)` trong lúc giữ, nếu không Node ném uncaught exception. Dẫn np-client (mục `client.on('error')`), và thêm bước pool vào lab. |
| db-drivers | 70 | major | B.6, E.18 | "Ứng dụng không đọc file dữ liệu. Nó gửi yêu cầu tới một tiến trình database qua kết nối mạng" mâu thuẫn với bài tiên quyết db-database-dbms (nguồn `sqlite-serverless`, ví dụ `sqlite-no-server`): SQLite đọc ghi trực tiếp file, không có tiến trình máy chủ. | Giới hạn vào database client/server như PostgreSQL 16, giống cách db-n-plus-one dòng 61 viết. |
| db-drivers | 93, 145 | major | B.4, B.6, E.17 | `[^np-client]` không đỡ câu "đưa giá trị đi tách khỏi câu lệnh": trang chỉ ghi `values` là mảng tham số. Mắt xích "có tham số thì driver dùng extended query" không có trong bài, nên câu hỏi 2 chưa trả lời được từ bài. Cả trang Client lẫn trang Queries đều không nói điều này, trong khi README dòng 29 ghi "suy ra từ thông báo lỗi và tài liệu". Mã nguồn mới xác nhận: `requiresPreparation()` trong `pg/lib/query.js` trả true khi `values.length > 0`. | Viết thẳng mắt xích đó. Dẫn mã nguồn `query.js` đúng 8.16.3, hoặc ghi rõ là suy ra từ lab. Câu "tách khỏi câu lệnh" dẫn node-postgres Queries như db-parameter-binding. Sửa README dòng 29. |
| db-drivers | 41, 55, 108 | major | B.7 | Câu về `node-oracledb` trong bài không có phiên bản, và `version` ở nguồn là "latest". Nguồn `np-pg-types` không có `version`. | Ghi "node-oracledb 26.0.0 (tài liệu latest, đối chiếu 02/11/2026)" sau khi xác nhận số này. Thêm `version: 2.2.0` cho pg-types (bản lab cài), kiểm README đúng bản đó. |
| db-drivers | 118, 128 | major | B.4, C.11, D.13 | Khuyến nghị "tiền không đổi sang `number`" không có nguồn và không ghi là khuyến nghị của bài. Lab `1.10` thành `1.1` chỉ cho thấy mất số 0 cuối, giá trị số không đổi, nên không chứng minh mất chính xác. Dấu hiệu "sai ở chữ số cuối" không có trong nguồn hay output. | Thêm bước lab cho thấy sai số khi cộng bằng `Number`, hoặc dẫn tài liệu PostgreSQL 16 về `numeric`. Không có thì bỏ "sai ở chữ số cuối" và ghi là khuyến nghị của bài. |
| db-orm | 56, 107 | major | B.6, D.13, E.15 | "mọi điều trong bài Driver và client vẫn đúng" và "`count(*)` qua QueryBuilder trả `"2"`" nói mạnh hơn lab, vì lab chỉ thấy điều đó với `getRawMany()`. Phép thử: `repository.count()` và `getCount()` trả `number`; chỉ raw mới là chuỗi. Nghiêm trọng hơn, cột `int8` khai báo `type: Number` đọc ra `number 9007199254740992` (`PostgresDriver.js:733-735` gọi `parseInt`), còn `type: 'bigint'` giữ chuỗi `9007199254740993`. Tức TypeORM có thể làm tròn đúng lỗi mà bài Driver cảnh báo. | Bỏ "mọi điều". Ghi rõ chuỗi là kết quả của `getRawMany()`. Thêm bước lab cho `count()`, `getCount()` và cột `int8` với hai cách khai báo, rồi thêm một lỗi thường gặp cho `type: Number`. |
| db-orm | 96, 123 | major | B.4, B.7 | "`update()` ... không qua logic của entity đã nạp" không có nguồn, không có trong lab, và mơ hồ. Đây là đánh đổi duy nhất nêu cho `update()`, câu hỏi 2 dựa vào nó. `UpdateQueryBuilder` vẫn broadcast `BeforeUpdate`/`AfterUpdate` (dòng 54-56, 93-95), nên "logic" cần định nghĩa. | Dẫn tài liệu TypeORM về listener và subscriber hoặc thêm bước lab, nói rõ cái gì chạy, cái gì không. Không có căn cứ thì bỏ. |
| db-orm | 106 | major | B.6, D.13 | "Dùng `save()` để cập nhật hàng loạt... mỗi dòng tốn một `SELECT` và một transaction" trái với `[^typeorm-repo]`: "saves all given entities in a single transaction". Lab chỉ đo một entity. Phép thử `save(mảng 5 entity)`: 8 câu, gồm 1 `SELECT`, `START TRANSACTION`, 5 `UPDATE`, `COMMIT`. Câu trong bài chỉ đúng khi gọi `save()` từng entity trong vòng lặp. | Giới hạn vào gọi trong vòng lặp. Với mảng thì nêu còn N `UPDATE`. Thêm bước lab. |
| db-drivers | 76 | minor | B.6 | "mỗi message bắt đầu bằng một byte cho biết loại": nguồn ghi startup message đầu tiên không có byte này. | Thêm "trừ startup message đầu tiên". |
| db-drivers | 88 | minor | B.6 | "chạy như một transaction ngầm" bỏ mất điều kiện của nguồn: "unless explicit transaction control commands are included". | Thêm "trừ khi chuỗi có lệnh điều khiển transaction tường minh". |
| db-drivers | 106 | minor | B.6, E.15 | "JavaScript không có số nguyên 64 bit; số quá lớn sẽ tràn" chép cách nói cũ của README. Cùng bài (dòng 126) dùng `BigInt` giữ đúng giá trị, và lab cho thấy bị làm tròn chứ không phải tràn. | Nói về kiểu `number`: giữ số nguyên chính xác tới `Number.MAX_SAFE_INTEGER`, kèm một nguồn mới. |
| db-drivers | 117, 146 | minor | B.6, E.19 | "không vượt quá phạm vi `number`" dễ hiểu sai: giá trị trên 2^53 vẫn trong phạm vi `number` nhưng mất chính xác. Nguồn nói `int4`. `Number.MAX_SAFE_INTEGER` xuất hiện lần đầu ở câu hỏi 3 mà chưa giải thích. | Đổi thành "phạm vi số nguyên an toàn" và giải thích trong phần thân. |
| db-drivers | 120 | minor | E.15 | Không nói prepared statement có tên lợi gì. Câu "Vì ... chỉ sống trong session, câu lệnh chạy một lần thì không được lợi gì" sai quan hệ nhân quả: lý do là không có lần dùng lại. | Nêu lợi ích và liên kết db-parameter-binding dòng 112-114. |
| db-drivers | 127 | minor | B.4, C.11 | "`count(*)` trả `int8`" chưa gắn nguồn, dù np-pg-types có nói. `"2" + 1` ra `"21"` không có trong output. | Thêm `[^np-pg-types]`. Thêm phép tính vào lab hoặc bỏ. |
| db-drivers | 52 | minor | A, B.5 | `title` nguồn khác trang thật: "32. Appendix A: Node-oracledb Thin and Thick Modes". | Sửa `title`. |
| db-drivers | 84, 95, 117 | minor | E.19 | `backend`, type parser, OID dùng mà chưa giải thích. | Giải thích ngắn ở lần đầu dùng. |
| db-orm | 68 | minor | D.13 | Ô ghi chú dễ hiểu là không có JOIN, trong khi SQL 2 của bước 5 có `INNER JOIN` giữa `users` và `requests`. | Nói rõ 3 câu gồm gì. |
| db-orm | 80 | minor | B.4 | Hành vi transaction của `save()` chưa gắn nguồn, dù typeorm-repo có ("By default transactions are enabled"). Bài cũng không nêu `SELECT` nằm ngoài transaction và bước 7 không mở transaction. | Thêm `[^typeorm-repo]` và nêu hai điểm này từ output. |
| db-orm | 89 | minor | D.13 | "Giá trị được truyền qua tham số" nói chung, trong khi output bước 3 và 5 có giá trị nội tuyến `IN (1)`, `IN (1, 2, 3, 4, 5)`. | Giới hạn vào giá trị trong câu `UPDATE`, hoặc ghi rõ ngoại lệ thấy trong lab. |
| db-orm | 97, 99 | minor | B.4 | Nhận định về SQL viết tay không có nguồn và không ghi là khuyến nghị của bài. | Ghi "khuyến nghị của bài" như các bài đã kiểm chứng. |
| db-orm | 65, 105 | minor | E.18 | Đọc `r.requester` không sinh truy vấn, trong khi db-n-plus-one dòng 57 nói truy vấn con "chạy ngầm khi code truy cập một thuộc tính". Không mâu thuẫn hẳn (Rails khác TypeORM), nhưng người học đọc tiếp sẽ vấp. | Thêm một câu: trong lab quan hệ không lazy nên không tự nạp, N+1 đến từ vòng lặp viết tay; lazy relation chưa thử. |
| db-orm | 56 | minor | E.19 | QueryBuilder dùng mà chưa giải thích. | Giải thích ngắn ở lần đầu dùng. |
| db-drivers, db-orm, db-timeouts | db-orm 80, 82; db-timeouts 122; db-drivers 93 | minor | E.18 | Tên bài liên kết khác tiêu đề thật: "Ranh giới transaction" là "Transaction boundary trong ứng dụng", "Parameter binding" là "Bind variable và SQL injection". | Dùng đúng tiêu đề. |
| db-timeouts | 73, 113 | minor | B.6 | "Tài liệu của Amazon": trang ghi ý kiến là của tác giả. Cách chọn timeout được nêu cho lời gọi trong một AWS Region, và trang nói nó "doesn't work" khi độ trễ mạng lớn hoặc p99.9 gần p50. Bài bỏ các điều kiện này khi áp sang database. | Ghi "bài của Amazon Builders' Library", nêu hai giới hạn và ghi rõ phần áp vào database là suy luận của bài. |
| db-timeouts | 91, 119 | minor | B.4 | `set local` chưa có nguồn, và lab không cho thấy tham số trở về sau transaction. | Dẫn tài liệu PostgreSQL 16 về `SET`, hoặc thêm `show` sau rollback vào lab. |
| db-timeouts | 95 | minor | C.11 | "sau 300 ms nghỉ": output không có mốc thời gian của sự kiện, chỉ có timeout 300 ms và "C nghỉ 800 ms". | Viết "đặt 300 ms, nghỉ 800 ms thì phiên đã bị kết thúc". |
| db-timeouts | 120 | minor | B.4 | Khuyến nghị thứ tự timeout giữa các tầng không có nguồn và không ghi là của bài. Lab bước 6 chỉ đỡ vế "làm ngược lại". | Ghi "khuyến nghị của bài" như dòng 119. |
| db-timeouts | 122 | minor | B.4 | Câu về việc PostgreSQL 16 không có timeout cho transaction chưa gắn nguồn. "trong tài liệu client config" nghe lửng. PostgreSQL 17 có `transaction_timeout`. | Gắn `[^pg-client-config]`, nêu ranh giới phiên bản và thêm nguồn tài liệu PostgreSQL 17. |
| db-timeouts | 131 | minor | E.16 | Dấu hiệu "không có truy vấn nào đang chạy" trái kịch bản dòng 73, nơi pool cạn vì câu lệnh chậm đang chạy. | Đổi thành "request treo ở bước lấy kết nối, số client đang mượn chạm `max`". |
| db-timeouts | 95, 113 | minor | E.19 | `dead tuple`, percentile và p99.9 dùng mà chưa giải thích. | Giải thích ngắn hoặc liên kết db-mvcc. |

Tổng: 1 blocker, 9 major, 22 minor.

### Xử lý

Blocker và 9 major đã sửa. Với các chỗ thiếu số đo, Claude mở rộng lab thay vì chỉ sửa chữ:

- `db-drivers`: thêm bước cộng tiền bằng `Number` so với `numeric`, và bước `count(*)` về dưới dạng chuỗi. Dẫn mã nguồn `pg` 8.16.3 cho việc dùng giao thức extended khi có tham số; thêm nguồn node-postgres Queries và MDN.
- `db-orm`: thêm bước `save()` một mảng, `count()` và `getCount()`, cột `int8` với hai cách khai báo. Bỏ ý về `update()` không qua logic của entity vì không có căn cứ.
- `db-timeouts`: bỏ `pg_dump`; thêm bước `connectionTimeoutMillis`, client đang mượn bị kết thúc, `set local` sau rollback; thêm nguồn PostgreSQL 17; nêu giới hạn của cách chọn timeout.

Các minor đã sửa theo đề xuất, trừ: `db-orm` dòng 56 (giải thích QueryBuilder) đã làm; `backend`, OID, type parser đã giải thích; percentile, dead tuple đã giải thích.

Kết luận vòng: cần vòng sau.

## Vòng 1 — 02/11/2026 — nhóm B

Bài: aidev-repo-context, aidev-reviewing-ai-code, aidev-tests-as-guardrails

Nguồn đã mở:
- cc-memory: mở được, đọc đủ phần bài trích (mục CLAUDE.md, AGENTS.md, Auto memory).
- cc-best: mở được, đọc toàn văn.
- agents-md: mở được.
- this-repo-claude: mở được (file ở HEAD).
- gh-review-ai: mở được, đọc toàn văn.
- google-review: mở được.
- perry-2023: mở được, gồm trang arXiv và PDF toàn văn v3.
- release-script: mở được (file ở HEAD).
- Mở thêm để đối chiếu, không thuộc `sources`: changelog Claude Code (bản mới nhất 2.1.316), `claude --version` trên máy (2.1.201), `.github/workflows/pages.yml`, `package.json`, `README.md`, `content/roadmap.yaml`.

`npm run validate`: `176 chủ đề (skeleton: 146, draft: 6, verified: 24) · 0 lỗi · 0 cảnh báo`. Không có lỗi hay cảnh báo cho ba bài. Cả ba bài đủ 7 mục đúng thứ tự, `changelog` có dòng soạn bài, id `related`, `prerequisites`, `parent` đều tồn tại.

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| aidev-repo-context | 63, 19, 121 | blocker | B6, B7, C11 | "Claude Code cũng đọc được `AGENTS.md`" sai ở phiên bản duy nhất bài nêu. cc-memory ghi "Reading `AGENTS.md` directly requires Claude Code v2.1.277 or later", changelog xác nhận tính năng thêm ở 2.1.277, còn `version` ghi máy chạy 2.1.201. Bài cũng bỏ điều kiện mặc định: chỉ đọc khi không có `CLAUDE.md` hay `CLAUDE.local.md` ở thư mục làm việc hoặc thư mục cha; có cả hai thì "Your `CLAUDE.md` files only". "Agent đọc file gần nhất" (dòng 63, câu hỏi dòng 121) là mô tả của trang AGENTS.md. Claude Code nạp mọi `AGENTS.md` từ thư mục làm việc trở lên, file ở thư mục con nạp khi đọc file trong đó. | Viết lại: từ 2.1.277, Claude Code đọc `AGENTS.md` thay cho `CLAUDE.md` khi không có file `CLAUDE.md` nào; có cả hai thì mặc định chỉ đọc `CLAUDE.md`, muốn dùng chung thì thêm `@AGENTS.md` vào `CLAUDE.md`. Ghi rõ "file gần nhất" là quy ước của trang AGENTS.md, và tách cách nạp của Claude Code. |
| aidev-repo-context | 19, 26, 33; thân bài 62, 76–81, 85, 102 | major | B7, B8 | Thân bài không ghi phiên bản hay ngày cho hành vi Claude Code nào (ngưỡng 200 dòng, cách nạp, bảng tất định). `version` ghép tài liệu hiện hành, ứng với bản khoảng 2.1.316, với máy 2.1.201, nên trông như đã kiểm trên 2.1.201 dù không phải. `agents-md` không có `version`. | Trong bài ghi "tài liệu Claude Code, đọc ngày 02/11/2026, bản mới nhất 2.1.316". Trong `version` ghi bản tài liệu, tách riêng bản đã chạy thử nếu có. Thêm `version` kiểu "trang hiện hành, 02/11/2026" cho `agents-md`. |
| aidev-repo-context | 54, 56 | major | B6, E15 | "Mỗi session... bắt đầu từ đầu" và "phải tìm lại cùng một dữ kiện ở mỗi session" nói mạnh hơn nguồn. Ngay câu sau câu được trích, cc-memory ghi "Two mechanisms carry knowledge across sessions", gồm cả auto memory. Auto memory "on by default in local sessions", nạp mỗi session (200 dòng hoặc 25KB đầu) và "machine-local". Bài không nhắc tới. | Thêm một câu về auto memory: Claude tự ghi, nằm riêng trên từng máy, không chia sẻ qua repo. Vì vậy kiến thức chung của nhóm vẫn phải ở file hướng dẫn. |
| aidev-repo-context | 74, 95, 101, 119 | major | B5, B6, E18 | Dòng 101 coi "chép cấu trúc thư mục và quy ước" là lỗi, trong khi dòng 74 gợi ý thêm "quy ước code". `aidev-writing-specs` dòng 76 cũng bảo để "chuẩn code" trong file hướng dẫn. Hai trang Claude Code bất đồng và bài không nói: cc-memory ghi "build commands, conventions, project layout", còn cc-best xếp mô tả file layout vào lời khuyên cũ. Mẫu `CLAUDE.md` của cc-best cũng có mục `# Conventions`. | Dòng 101 đổi thành "quy ước đọc được từ code", giữ nguyên phép thử hai câu. Thêm một câu nói rõ hai trang tài liệu khác nhau về project layout và bài theo cc-best. Quy ước không suy ra được từ code vẫn nên ghi. |
| aidev-repo-context | 81, 103 | major | B4, B6, E15 | Khuyến nghị bảo mật "dùng deny rule hoặc hook" không có nguồn gắn kèm và bỏ giới hạn của nguồn. cc-best ghi "Rules match tool calls, not intent", deny rule "won't catch a script that opens the file", và "for anything security-related you want both" (kèm sandbox). Bảng ghi "công cụ luôn áp dụng" cho mọi hook, nhưng cc-best nói `prompt` hoặc `agent` hook "isn't deterministic either". | Gắn [^cc-best]. Thêm giới hạn deny rule và khuyến nghị dùng cùng sandbox cho việc liên quan bảo mật. Ghi trong bảng rằng chỉ `command` hoặc `http` hook mới tất định. |
| aidev-repo-context | 85, 109–113 | major | B6, E15 | Ví dụ nêu sáu bước release trong `CLAUDE.md` như mẫu nên làm, trái với nguồn bài trích. cc-memory bảo chuyển "a multi-step procedure" sang skill hoặc path-scoped rule. cc-best nói quy trình release dài đặt trong skill thì không đè lên việc không liên quan như khi nằm trong `CLAUDE.md`. Mục "Giữ file ngắn" không nêu skill hay `.claude/rules/` với `paths:`, là hai cách nguồn đưa ra để làm file ngắn. | Thêm hai cơ chế trên vào "Giữ file ngắn". Trong ví dụ ghi rõ: đây là điều không suy ra được từ code, nhưng theo tài liệu thì quy trình nhiều bước nên chuyển sang skill. |
| aidev-repo-context | 83 | minor | B4 | Khuyến nghị "Quy tắc không có ngoại lệ thì đặt ở loại thứ hai" thiếu nguồn gắn kèm. | Gắn [^cc-best]. |
| aidev-repo-context | 97 | minor | B6 | "Chỉ cần khi" mạnh hơn "usually happens when" của nguồn. Ý "dự án nhỏ" không có trong nguồn. | Đổi thành "thường cần khi", và ghi "dự án nhỏ" là suy luận của bài. |
| aidev-repo-context | 105 | minor | B4 | Lỗi và dấu hiệu không có nguồn, cũng không ghi là kinh nghiệm của bài (`aidev-writing-specs` dòng 96 có ghi cách này). | Ghi "kinh nghiệm bài này nêu", hoặc trích ý `/doctor prompt-audit` tìm lệnh không tồn tại trong cc-memory. |
| aidev-repo-context | 115 | minor | B8, C9 | Nguồn ghi "at time of writing" nhưng bài bỏ mốc này. Ví dụ không khai trong `examples`, không có `[ex:id]`. | Thêm "tại thời điểm trang viết" và khai thành ví dụ `official-doc`. |
| aidev-repo-context | 5 | minor | A3 | `summary` có "tài liệu" nhưng bài không bàn cách đưa tài liệu cho agent. | Thêm một câu về import `@README`, `@docs/...` theo cc-memory, không cần sửa `summary`. |
| aidev-repo-context | 54, 63, 80–81 | minor | E19 | "context window", "hook", "deny rule", "managed setting", "skill" không được giải thích ở lần đầu dùng. Bài dùng "session", còn `aidev-writing-specs` dùng "phiên". | Giải thích ngắn tại chỗ, thống nhất một từ. |
| aidev-repo-context | 16, 43, 113 | minor | C9 | Tiêu đề nguồn thiếu "for Claude Code". File của chính repo mang `kind: official-doc`. Gạch đầu dòng 113 không thuộc danh sách "ghi những điều không suy ra được từ code". | Sửa tiêu đề. Cân nhắc đổi `kind` thành `public-case`. Tách dòng 113 thành câu riêng. |
| aidev-reviewing-ai-code | 55, 62, 91, 105 | major | B5, E15 | Bài tự ghi "bài này chỉ đọc phần tóm tắt", trái điểm 5 (đọc toàn văn), dù PDF mở được. Hệ quả là thiếu dữ kiện quan trọng: 47 người (33 có AI, 14 đối chứng), năm tác vụ bảo mật bằng Python, JavaScript, C. Kết quả lệch ở "four of our five programming tasks", tác vụ C không kết luận được. Mục 7.2 nêu giới hạn "consisted mainly of university students" (66% đại học, 19% sau đại học) và môi trường nhân tạo. Dòng 91 chỉ nêu giới hạn về đời model. | Đọc toàn văn, bỏ câu tự nhận. Thêm các con số trên, phạm vi "tác vụ liên quan bảo mật", và giới hạn của chính tác giả vào "Giới hạn của bằng chứng". Sửa `changelog`. |
| aidev-reviewing-ai-code | 40, 77 | major | B7, B8 | Hành vi `/code-review` trong bài không có phiên bản hay ngày, thiếu cả điều kiện "in the terminal" của nguồn. `version` ghép tài liệu với máy 2.1.201 như dòng 26 của repo-context. | Ghi ngày đọc và bản tài liệu trong bài, thêm "trong terminal", sửa `version`. |
| aidev-reviewing-ai-code | 85 | major | B4 | Khuyến nghị dạng so sánh nhất "Giữ thay đổi nhỏ là cách rẻ nhất để review được" không có nguồn. | Mở đọc trang "Small CLs" của Google rồi trích, hoặc bỏ "rẻ nhất" và ghi là kinh nghiệm của bài. |
| aidev-reviewing-ai-code | 62 | minor | B6 | Nghiên cứu đo niềm tin về độ an toàn khi tự viết code có trợ lý, không đo việc review diff của agent. Câu "cái bẫy chính" là suy luận của bài nhưng đặt như điều nguồn cho thấy. | Tách suy luận khỏi kết quả, nêu đúng phạm vi đã đo. |
| aidev-reviewing-ai-code | 9, 66 | minor | F20, E18 | `prerequisites` trỏ tới `ops-code-review`, ở chặng 18 và còn `skeleton`, trong khi bài này ở chặng 4. Câu "nói kỹ phần này" hứa nội dung chưa có. | Chuyển sang `related`, sửa câu thành "sẽ nói kỹ ở chặng 18". |
| aidev-reviewing-ai-code | 96, 97 | minor | B6 | GitHub chỉ nói test bị "deleted or skipped"; ý "giá trị mong đợi bị đổi" không có trong nguồn. "Ít lượt tải", "tên gần giống" cũng là suy luận. Bài bỏ ý package độc hại (slopsquatting) của nguồn. | Đặt phần suy luận ngoài câu có nguồn gắn kèm. Thêm slopsquatting. |
| aidev-reviewing-ai-code | 106 | minor | B6 | Trang GitHub có tám mục, bài liệt kê sáu mà không nói. | Ghi "sáu trong tám mục", hoặc thêm mục tự động hóa. |
| aidev-reviewing-ai-code | 60 | minor | B4 | Các nhận định mở bài ("viết nhanh hơn người đọc", "diff lớn, comment đầy đủ") không có nguồn. | Ghi là nhận xét của bài, hoặc lược bớt. |
| aidev-tests-as-guardrails | 37, 44, 110 | blocker | B6, C11, E18 | Ví dụ sai ở hai điểm và làm hỏng luận điểm của bài. (1) "Không có bản để publish" không đúng: `npm run build` (bước 6) tạo `dist/artifact.html` trước Playwright (bước 7), nên lỗi bước 7 vẫn để lại bản mới, còn lỗi bước sớm hơn để lại bản cũ. Script không xóa `dist`; chú thích dòng 2 của `release.ts` mâu thuẫn với chính code. (2) "Agent... không thể bỏ qua bước này" sai: `release.ts` dòng 4 ghi publish do Claude làm bằng công cụ Artifact, và chốt chặn duy nhất là dòng "không publish" trong `CLAUDE.md`, tức loại không tất định theo bảng dòng 73–76. Repo không có `.claude/settings.json`. Push `main` cũng deploy Pages qua `pages.yml` mà không chạy script này và không có test end-to-end. | Bỏ câu "không thể bỏ qua". Viết lại: script dừng, thoát mã 1 và in "Không publish"; việc không publish là chỉ dẫn, không tất định. Nếu cần ví dụ tất định, dùng `pages.yml`: job `deploy` có `needs: build`, nên build fail thì không deploy. Sửa `supports` và tiêu đề ví dụ theo cùng hướng. |
| aidev-tests-as-guardrails | 49, 76, 111 | major | B6, E16 | "Luôn được thực thi" và "agent làm tiếp cho tới khi `tsc` pass" bỏ giới hạn nguồn nêu ngay sau: "If the hook blocks eight stops in a row with no tool call between them, Claude Code overrides the next block and ends the turn" (thêm vào từ 2.1.143). Test và typecheck cũng chỉ được ép khi gắn vào hook hoặc CI; yêu cầu trong prompt thì "Claude decides for itself". | Thêm giới hạn 8 lần chặn liên tiếp và biến `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`. Sửa bảng: "chạy bởi công cụ, không do model quyết định, khi đã cấu hình vào hook hoặc CI". |
| aidev-tests-as-guardrails | 19, 59, 71–78, 111 | major | B7, B8 | Thân bài không có phiên bản hay ngày cho `/goal`, `/code-review`, `Stop` hook. Mở bài nói "Coding agent dừng...", trong khi nguồn chỉ nói về Claude. `version` lỗi như hai bài trên. | Ghi ngày đọc và bản tài liệu trong bài, nêu tên sản phẩm ở câu mở, sửa `version`. |
| aidev-tests-as-guardrails | 93 | major | B4 | Nhận định so sánh "Test viết bởi chính agent yếu hơn" và khuyến nghị đi kèm không có nguồn, cũng không ghi là suy luận. | Tìm nguồn đã đọc, hoặc đổi thành lập luận và ghi "kinh nghiệm bài này nêu". |
| aidev-tests-as-guardrails | 69, 97 | minor | B4 | Hai khuyến nghị thiếu nguồn gắn kèm dù cc-best hỗ trợ một phần ("a failing test it has to turn green", `/verify`). | Gắn [^cc-best], đúng phạm vi nguồn nói. |
| aidev-tests-as-guardrails | 95 | minor | B6 | Tiêu đề "Đừng thêm test cho trường hợp không thể xảy ra" đến từ cc-best, nhưng nguồn gắn kèm là Google, vốn nói về độ phức tạp trong test. | Gắn [^cc-best] cho tiêu đề, giữ [^google-review] cho câu sau. |
| aidev-tests-as-guardrails | 94 | minor | B6 | cc-best chỉ nói nên ghi cách chạy một file test, không nói test chậm làm chậm vòng lặp. | Tách phần suy luận khỏi câu có nguồn. |
| aidev-tests-as-guardrails | 67 | minor | E15 | "Test cũ fail nghĩa là hành vi cũ đã đổi" bỏ qua test flaky và lỗi môi trường. | Đổi thành "thường nghĩa là", nêu trường hợp ngoại lệ. |
| aidev-tests-as-guardrails | 104 | minor | E18, F20 | Không có bài tên "Testing" hay "Integration testing". Tên thật là "Kiểm thử frontend" và "Kiểm thử tích hợp", đều `skeleton` và không nằm trong `related`. Lỗi "Test chỉ kiểm mock" cũng không có nguồn. | Sửa tên, thêm vào `related`, ghi lỗi này là kinh nghiệm của bài. |
| aidev-tests-as-guardrails | 101, 102, 105 | minor | E18 | Trùng với `aidev-reviewing-ai-code` dòng 95–96 và `aidev-writing-specs` dòng 95. | Giữ một chỗ chính, chỗ còn lại liên kết sang. |
| aidev-tests-as-guardrails | 42, 75 | minor | C9, E19 | `release.ts` là code nhưng mang `kind: official-doc`. `/goal` không được giải thích. | Cân nhắc đổi `kind`, thêm một câu giải thích `/goal`. |
| aidev-writing-specs (ngoài phạm vi, không tính vào tổng) | 74, 95, 99, 104–106 | ghi chú | B8 | Trang cc-best đã đổi so với `checkedAt` 15/10/2026. Ở bản 02/11/2026 không còn `foo.py`, `validateEmail`, chữ "half", "trust-then-verify", plan mode hay luồng bốn bước; cặp ví dụ "fix the login bug" cũng đã đổi câu chữ. Bài này đang `verified`. | Đối chiếu lại bài này với bản hiện hành, tách khỏi nhóm B. |

Tổng: 2 blocker, 11 major, 17 minor.

### Xử lý

2 blocker và 11 major đã sửa. Với nghiên cứu Perry, Claude đọc toàn văn (không còn chỉ phần tóm tắt) và thêm cỡ mẫu, số tác vụ, giới hạn do tác giả nêu. Chú thích đầu `scripts/release.ts` đã sửa cho đúng hành vi. `ops-code-review` chuyển từ `prerequisites` sang `related`, vì bài đó ở chặng 18.

Minor giữ nguyên, chuyển sang nhóm tồn:
- `aidev-repo-context`: thống nhất chữ "session" và "phiên".
- `aidev-tests-as-guardrails` dòng 101, 102, 105: phần trùng với `aidev-reviewing-ai-code`.

Ghi chú ngoài phạm vi về `aidev-writing-specs`: chuyển sang nhóm tồn (đối chiếu lại với tài liệu Claude Code hiện hành).

Kết luận vòng: cần vòng sau.

## Vòng 2 — 02/11/2026 — nhóm A
Bài: db-drivers, db-orm, db-timeouts

Nguồn đã mở:
- db-drivers:
  - Mở được: pg-protocol-overview, pg-protocol-flow, np-types, np-pg-types, np-queries, pg-query-source, mdn-max-safe, oracledb-modes.
  - np-client: mở được ở db-timeouts, cùng url.
- db-orm:
  - Mở được: typeorm-repo, typeorm-find.
  - typeorm-patterns: không mở lại, vì chỗ đổi không trích.
- db-timeouts:
  - Mở được: pg-client-config, pg17-client-config, np-client, np-pool, aws-timeouts, pg-protocol-flow.
  - pg-signal: không mở lại, vì chỗ đổi không trích.
- Mở thêm để đối chiếu: PostgreSQL 16 `SET`, Release Notes của node-oracledb, `pg_dump.c` nhánh REL_16_STABLE.
- Giới hạn: WebFetch trả nội dung qua mô hình trích xuất. Riêng typeorm-repo và np-pool, tôi tải thêm text thô để tìm từ khóa.

Validate: `npm run validate` cho `176 chủ đề (skeleton: 146, draft: 6, verified: 24) · 0 lỗi · 0 cảnh báo`.

Lab: khối "Kết quả thật" trong README của cả 3 lab khớp `output.txt`. Mọi số và thông báo lỗi mới trong bài khớp output. `pg` 8.16.3, `pg-pool` 3.14.0, `pg-types` 2.2.0, TypeORM 1.1.2 khớp lockfile và `node_modules`. `requiresPreparation()` ở `lab/node_modules/pg/lib/query.js` khớp bản trên unpkg.

Phát hiện vòng 1:
- Blocker và 8 trong 9 major đã xử lý đúng. Major về phiên bản `node-oracledb` mới xử lý một phần, xem bảng.
- 19 trong 22 minor đã xử lý đúng.
- Ba minor còn dở: `db-orm` dòng 89 và `set local` (xem bảng); nhóm tên bài liên kết chỉ còn hai tên sót ở `db-orm` dòng 77 và `db-timeouts` dòng 102 (xem bảng).
- Các dòng changelog mới mô tả đúng thay đổi, trừ vế về tên bài của `db-orm` (xem bảng).
- Không có mâu thuẫn mới với db-connection-pool, db-transaction-boundary, db-n-plus-one, db-parameter-binding.

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| db-drivers | 132, 77 | major | B.7 | Major vòng 1 chưa xong: bài chỉ ghi "tài liệu đọc ngày 02/11/2026", không có phiên bản, trong khi `CLAUDE.md` đòi tên và phiên bản. Số này xác định được: Release Notes ghi "node-oracledb v26.0.0 (8 Oct 2026)", không đánh dấu unreleased. | Dòng 132 ghi "`node-oracledb` 26.0.0 (tài liệu latest, đối chiếu 02/11/2026)". Sửa `version` dòng 77 cho khớp. |
| db-orm | 58–63 | major | B.6, B.7 | Danh sách mới nêu hành vi như điều luôn đúng, không ghi là kết quả lab, không có phiên bản hay nguồn. Bản cũ có "lab thấy", lần sửa làm mất chữ này. Số khớp output bước 9, 12, 13, và `PostgresDriver.js` dòng 733-735 đỡ cơ chế `type: Number`, nhưng câu vẫn rộng hơn điều lab đo. | Mở đầu danh sách bằng "Lab với TypeORM 1.1.2, `pg` 8.16.3 cho thấy:". |
| db-orm | 104 | major | B.6 | `[^typeorm-repo]` đặt cuối câu có vế "`save()` tốn thêm một `SELECT`", nhưng trang không nói `save` đọc trước (tìm trong text thô, chỉ `preload` nói load). Vế này chỉ đến từ lab bước 6. Với `update()`, trang chỉ có ví dụ một `UPDATE` trong mỗi lần gọi, không nêu số câu nói chung. | Viết "Lab: `save()` tốn thêm một `SELECT`; `update()` chỉ một câu `UPDATE`" và bỏ `[^typeorm-repo]`. |
| db-timeouts | 100, 128; README db-timeouts, mục Kết luận | major | B.4, D.13 | Lab không chứng minh được tác dụng của `set local`. Theo tài liệu PostgreSQL 16 `SET`, `SET` thường trong transaction bị hủy cũng mất tác dụng khi rollback, nên `show` trả `0` với cả hai. Khác biệt chỉ lộ sau `commit`: `SET` thường giữ tới hết session, `SET LOCAL` thì không. Nhận định vẫn không có nguồn, trong khi dòng 128 đề xuất dùng. | Thêm nguồn https://www.postgresql.org/docs/16/sql-set.html và gắn vào câu. Thêm bước lab so `set local` với `set` sau `commit`, hoặc bỏ vế "lab cho thấy". Sửa README theo. |
| db-timeouts | 139, 144, 150–151; README db-timeouts dòng 5 | major | B.7, D.12 | Thông báo `timeout exceeded when trying to connect` và việc lỗi không qua `pool.on('error')` là hành vi của `pg-pool`, nhưng bài và README chỉ ghi `pg` 8.16.3. `pg` 8.16.3 khai `pg-pool` là `^3.10.1`, nên không xác định được bản pool. Bản lab cài là 3.14.0, và db-connection-pool dòng 102 đã ghi rõ. | Thêm `pg-pool` 3.14.0 vào dòng 144 và mục Môi trường của README. Thêm Node.js v25.2.1 vào dòng 144, vì `uncaughtException` là hành vi của tiến trình Node. |
| db-drivers | 130, 61 | minor | B.6 | "số lớn hơn nên dùng `BigInt`" mạnh hơn nguồn: MDN chỉ khuyên cân nhắc. | Viết "có thể dùng", sửa `supports` theo. |
| db-drivers | 117 | minor | B.6 | "có mảng tham số" rộng hơn nguồn: mảng rỗng vẫn đi simple query, vì hàm trả `values.length > 0`. | Viết "mảng tham số khác rỗng". |
| db-drivers | 19, 26 | minor | B.5 | Hai điều kiện đã thêm vào thân bài (startup message không có byte loại, ngoại lệ lệnh transaction tường minh) chưa có trong `supports`. | Bổ sung vào hai trường `supports`. |
| db-drivers | README db-drivers dòng 5 | minor | D.12 | Nguồn np-pg-types ghi "lab cài 2.2.0", số này đúng, nhưng README không nhắc `pg-types`, dù vòng 1 đề nghị kiểm. Đổi kiểu `int8` là phần trọng tâm của lab. | Thêm `pg-types` 2.2.0 vào mục Môi trường. |
| db-orm | 97 | minor | D.13 | "danh sách id ở các câu `SELECT` phụ, TypeORM ghi trực tiếp" rộng hơn output: bước 5 SQL 2 và `SELECT` của `save()` ở bước 11 dùng `IN ($1, ..., $5)`. Chỉ bước 5 SQL 3 và các câu `IN (n)` ở bước 3 là nội tuyến. | Viết "một số câu `SELECT` phụ (lab bước 3, bước 5 SQL 3)". |
| db-orm | 104, 134 | minor | E.15, E.17 | Thân bài chỉ có `update({ id }, ...)`, chưa nói `update()` nhận điều kiện hay nhiều id, nên câu hỏi 1.000 dòng chỉ trả lời được qua dòng 107. Sau khi bỏ ý cũ, `update()` cũng không còn đánh đổi nào. | Thêm một vế có `[^typeorm-repo]` về điều kiện và nhiều id. Nêu lúc `save()` hợp hơn nếu có căn cứ, ví dụ lúc cần insert hoặc update theo trạng thái dòng. |
| db-orm, db-timeouts | db-orm 77; db-timeouts 102 | minor | E.18, F.21 | Còn hai tên bài khác tiêu đề: "bài N+1" là "Vấn đề N+1", "bài Locking" là "Locking và deadlock". Changelog db-orm ghi "dùng đúng tên bài liên quan". | Dùng đúng tiêu đề. |
| db-timeouts | 96 | minor | B.4, D.13 | "client đang giữ không bị ảnh hưởng" không có trong output: bước 7 không chạy câu lệnh nào trên client đang giữ sau lỗi, chỉ `release`. | Đổi ô thành điều output cho thấy, hoặc thêm một truy vấn vào bước 7 rồi chạy lại. |
| db-timeouts | 139 | minor | D.13 | "Client đang được mượn từ pool cũng vậy" nói nhiều hơn bước 8: output chỉ có `uncaughtException` với `25P03`, không có `Connection terminated unexpectedly` hay lỗi truy vấn tiếp theo. Bước 8 cũng không chạy trường hợp có gắn `client.on('error')`. | Bỏ "cũng vậy", chỉ nêu điều bước 8 in ra. |
| db-timeouts | 122 | minor | E.19 | `p50` xuất hiện mới mà chưa giải thích, dù `p99.9` đã có giải thích. | Thêm "p50 là trung vị". |

Tổng: 0 blocker, 5 major, 10 minor.

### Xử lý

5 major đã sửa:

- `db-drivers`: ghi `node-oracledb` 26.0.0. Claude mở Release Notes: mục mới nhất là "node-oracledb v26.0.0 (8 Oct 2026)", không đánh dấu unreleased.
- `db-orm`: danh sách đổi kiểu mở đầu bằng "Lab với TypeORM 1.1.2, `pg` 8.16.3 cho thấy:". Dòng 104 ghi là kết quả lab, bỏ `[^typeorm-repo]`.
- `db-timeouts`: thêm nguồn `SET` của PostgreSQL 16 và lab bước 9, so `set local` với `set` thường sau `commit` và sau `rollback`. README sửa theo.
- `db-timeouts`: ghi `pg-pool` 3.14.0 và Node.js. Lần chạy lại dùng Node.js v24.22.2, vì bản toàn cục của nvm trên máy Lam đã đổi. Bài và README ghi v24.22.2, không phải v25.2.1 như đề xuất. `db-drivers` và `db-orm` không chạy lại, nên vẫn là v25.2.1.

2 minor đã xử lý cùng lúc:

- `db-timeouts` dòng 96: lab bước 7 chạy thêm một câu trên client đang giữ, output có `{"van_chay":1}`. Bài không đổi chữ.
- `db-timeouts` dòng 139: bỏ "cũng vậy", vì câu này đã phải sửa cho major về `pg-pool`.

8 minor giữ nguyên, chuyển sang nhóm tồn. Lý do chung: vòng 3 là vòng cuối, mỗi câu mới có thể sinh phát hiện mới, và không minor nào làm sai nhận định chính của bài.

- `db-drivers` dòng 130, 61: "có thể dùng `BigInt`".
- `db-drivers` dòng 117: "mảng tham số khác rỗng".
- `db-drivers` dòng 19, 26: bổ sung `supports`.
- README `db-drivers`: thêm `pg-types` 2.2.0.
- `db-orm` dòng 97: "một số câu `SELECT` phụ".
- `db-orm` dòng 104, 134: nói `update()` nhận điều kiện và nhiều id.
- `db-orm` dòng 77, `db-timeouts` dòng 102: dùng đúng tiêu đề "Vấn đề N+1", "Locking và deadlock".
- `db-timeouts` dòng 122: giải thích p50.

Kết luận vòng: cần vòng sau.

## Vòng 2 — 02/11/2026 — nhóm B

Bài: aidev-repo-context, aidev-reviewing-ai-code, aidev-tests-as-guardrails, learn-lab (một câu và dòng changelog), scripts/release.ts (chú thích đầu file)

Nguồn đã mở:
- cc-memory: mở được, đọc các mục bài trích (đầu trang, Size, Import, AGENTS.md, Auto memory).
- cc-best: mở được, đọc toàn văn.
- agents-md: mở được, đọc các câu bài trích.
- gh-review-ai: mở được, đối chiếu cấu trúc mục và các câu bài trích. Trang có 8 mục nội dung cộng "Further reading".
- google-review: mở được, đọc mục Tests, Context, Every Line.
- google-small-cls: mở được, đọc mục lợi ích của thay đổi nhỏ.
- perry-2023: mở được, gồm trang arXiv (WebFetch) và PDF v3 (tải bằng curl, trích bằng pdftotext). Đã đọc phần kết quả năm tác vụ, Table 1 và mục 7.2.
- this-repo-claude: mở được (file ở HEAD).
- release-script: mở được (file ở HEAD).
- pages-workflow: mở được (file ở HEAD).
- Mở thêm để đối chiếu, không thuộc `sources`:
  - changelog Claude Code: chỉ đọc đoạn đầu trang, bản mới nhất 2.1.316, ngày 31/10/2026.
  - 21 thư mục `lab/experiments`, `package.json`, `README.md`, `content/roadmap.yaml`, `aidev-writing-specs`.

`npm run validate`: `176 chủ đề (skeleton: 146, draft: 6, verified: 24) · 0 lỗi · 0 cảnh báo`. Không có lỗi hay cảnh báo cho các bài.

Không có phát hiện ở `learn-lab` và `scripts/release.ts`:
- 20 README lab PostgreSQL đều có câu dùng PostgreSQL 16 có sẵn kèm `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`. `db-lsm-tree` không phải lab PostgreSQL.
- Dòng changelog đúng: 17 + 3 lab mới (`db-drivers`, `db-orm`, `db-timeouts`).
- Chú thích `release.ts` khớp code.

Mọi số liệu Perry khớp PDF: 47 người gồm 33 và 14; năm tác vụ; 66% và 19%; bốn trong năm tác vụ; tác vụ C lẫn lộn.

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| aidev-repo-context | 99, 103 | major | B6, E15 | Câu mới nêu import `@README` là một trong "ba cách để file ngắn lại", ngay sau lý do "file dài tốn context". Chính gạch đầu dòng Size của cc-memory ghi import "don't reduce its context cost", vì file được import nạp cùng `CLAUDE.md`. Chữ "trỏ tới" khiến người đọc tưởng file chỉ nạp khi cần, trong khi cả README vào context ở mọi session. Đây là cơ chế mô tả sai một phần, phát sinh khi xử lý minor dòng 5 của vòng 1. | Đổi thành "hai cách" (skill, path-scoped rule). Tách import thành câu riêng: giúp sắp xếp file, không giảm context, vì file được import nạp cùng `CLAUDE.md`. |
| aidev-repo-context, aidev-reviewing-ai-code, aidev-tests-as-guardrails | repo-context 19, 26, 70; reviewing 46, 85; tests 21, 75 | major | B7 | Major về phiên bản của vòng 1 mới xử lý một nửa. Bỏ được chỗ ghép với máy 2.1.201 là đúng, nhưng thân bài và `version` chỉ còn ngày đọc, không có số phiên bản dù vòng 1 đề xuất ghi 2.1.316. `CLAUDE.md` bắt buộc hành vi sản phẩm kèm tên và phiên bản. Trong thân bài chỉ `AGENTS.md` có số bản. Các hành vi `/code-review`, `/goal`, `/verify`, `Stop` hook và giới hạn tám lần không có số bản. Ngoài ra, changelog xác nhận 2.1.316 là bản mới nhất ở ngày đọc. | Ghi "đọc ngày 02/11/2026, bản mới nhất 2.1.316" trong câu và trong `version`, thêm changelog vào `sources`. Nếu muốn coi ngày đọc là đủ cho trang tài liệu không đánh số bản, Lam cần quyết và ghi vào checklist. |
| aidev-repo-context | 97 | minor | B6, E19 | "Hook là script" hẹp hơn nguồn và lệch với chính đoạn này. cc-best nêu hook có thể là lệnh shell, POST tới HTTP endpoint, lời gọi công cụ MCP, hoặc `prompt`/`agent` hook. Bảng dòng 95 và câu kế tiếp cũng nhắc `http`, `prompt`, `agent` hook. | Đổi thành "Hook là thứ bạn cấu hình để chạy ở các điểm cố định…, thường là một lệnh shell". |
| aidev-repo-context | 62, 95, 121 | minor | E19 | "managed setting" vẫn chưa được giải thích, dù vòng 1 đã nêu và phần Xử lý không nhắc. "sandbox" là từ mới, cũng chưa giải thích. Câu mới dòng 62 dùng cả "session" lẫn "phiên" trong cùng một câu. | Thêm giải thích ngắn: managed setting do tổ chức đặt, người dùng không ghi đè được; sandbox giới hạn ở cấp hệ điều hành. Dòng 62 đổi thành "trong session đó". |
| aidev-repo-context | 95 | minor | B6, E18 | "công cụ luôn áp dụng" vẫn còn, trong khi vòng 1 đã sửa đúng ý này ở `aidev-tests-as-guardrails`. `command` hook thuộc hàng này nhưng có giới hạn tám lần chặn của `Stop` hook. cc-best cũng ghi cần `onFailure: "block"` nếu muốn chặn cả khi hook lỗi hoặc timeout. | Đổi thành "công cụ áp dụng, không do model quyết định", và trỏ sang bài Test làm lưới an toàn cho giới hạn của `Stop` hook. |
| aidev-repo-context | 77 | minor | B6 | Câu đúng với nguồn nhưng thiếu ba điểm. (1) `.claude/CLAUDE.md` cũng được tính. (2) Có session không đọc được `AGENTS.md` dù đủ phiên bản, ví dụ plugin bị tắt. (3) Đề xuất vòng 1 "tách cách nạp của Claude Code" chưa làm: chữ "theo cách riêng" không nói rằng Claude Code nạp mọi `AGENTS.md` từ thư mục làm việc trở lên, nên người đọc có thể áp quy ước "file gần nhất" của dòng 75 cho Claude Code. | Thêm một câu về cách nạp, nêu `.claude/CLAUDE.md` và cài đặt **Project instructions**. |
| aidev-tests-as-guardrails | 118 | minor | B6, E18 | Dòng này vẫn gắn "diff đổi giá trị mong đợi" vào [^gh-review-ai]. Vòng 1 đã xác định GitHub không nói ý này, và `aidev-reviewing-ai-code` dòng 104 đã tách thành "Bài này thêm một dấu hiệu". Hai bài cùng chặng giờ ghi khác nhau về cùng một ý. | Tách như dòng 104 của bài kia, hoặc đặt ý giá trị mong đợi sau chú thích nguồn và ghi là kinh nghiệm của bài. |
| aidev-tests-as-guardrails | 94, 128 | minor | B6 | Bài nêu tám lần chặn như giới hạn cố định. Nguồn ghi ngay sau đó là có thể nâng bằng `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`. Đề xuất vòng 1 có biến này nhưng bài chưa thêm. | Thêm nửa câu về biến này ở dòng 94. |
| aidev-reviewing-ai-code | 61 | minor | F21 | Dòng changelog của lần soạn bị sửa hồi tố, bỏ "phần tóm tắt". Lần soạn thật sự chỉ đọc tóm tắt, nên dòng này không còn đúng với sự việc. Dòng vòng 1 đã ghi việc đọc toàn văn nên không cần sửa dòng cũ. | Trả dòng soạn bài về nguyên văn, giữ dòng vòng 1. |
| docs/reviews/chang-04.md (phần Xử lý) | 185–187 | minor | Quy trình ("giữ nguyên: lý do…") | Hai mục giữ nguyên chỉ ghi "chuyển sang nhóm tồn", không có lý do. Việc hoãn có thể chấp nhận: thống nhất "session/phiên" đụng bài `verified` `aidev-writing-specs`, còn phần trùng của `aidev-tests-as-guardrails` ngắn và có liên kết qua `prerequisites`. Phần Xử lý cũng không nhắc các đề xuất chưa làm ở các dòng trên (`managed setting`, biến cap). Riêng `kind: official-doc` không đổi là hợp lý vì `README.md` và `learn-using-mindmap` dùng cùng cách, nhưng cũng chưa ghi lại. | Ghi lý do cho từng mục giữ nguyên và liệt kê đủ các minor chưa sửa. |

Tổng: 0 blocker, 2 major, 8 minor.

### Xử lý

2 major đã sửa:

- `aidev-repo-context`: còn hai cách làm file ngắn; import tách thành câu riêng: giúp sắp xếp, không giảm context. Claude mở trang bộ nhớ, câu gốc là "don't reduce its context cost".
- Cả ba bài: ghi "khi bản mới nhất là 2.1.316" trong câu và trong `version`, thêm nguồn `cc-changelog`. Claude mở trang changelog: mục đầu là 2.1.316, ngày 31/10/2026.

2 minor đã xử lý:

- `aidev-reviewing-ai-code` dòng 61: trả dòng soạn bài về nguyên văn.
- Phần Xử lý của vòng 1: lý do giữ nguyên hai minor là: thống nhất "session" và "phiên" sẽ đụng bài `verified` `aidev-writing-specs`; phần trùng của `aidev-tests-as-guardrails` ngắn và đã có liên kết qua `prerequisites`. `kind: official-doc` của hai ví dụ giữ nguyên, vì `README.md` và `learn-using-mindmap` dùng cùng cách.

6 minor giữ nguyên, chuyển sang nhóm tồn, cùng lý do với nhóm A:

- `aidev-repo-context` dòng 97: "Hook là script" hẹp hơn nguồn.
- `aidev-repo-context` dòng 62, 95, 121: giải thích `managed setting`, `sandbox`; thống nhất "session" và "phiên" ở dòng 62.
- `aidev-repo-context` dòng 95: "công cụ luôn áp dụng" và giới hạn của `Stop` hook.
- `aidev-repo-context` dòng 77: cách nạp `AGENTS.md` của Claude Code, `.claude/CLAUDE.md`, session không đọc được `AGENTS.md`.
- `aidev-tests-as-guardrails` dòng 118: tách ý giá trị mong đợi khỏi `[^gh-review-ai]`.
- `aidev-tests-as-guardrails` dòng 94, 128: biến `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`.

Kết luận vòng: cần vòng sau.

## Vòng 3 — 02/11/2026 — nhóm A
Bài: db-drivers, db-orm, db-timeouts

Nguồn đã mở:
- db-drivers:
  - oracledb-modes: mở được.
  - Mở thêm để đối chiếu: Release Notes của node-oracledb, mở được. Mục đầu là "node-oracledb v26.0.0 (8 Oct 2026)", không đánh dấu unreleased. `npm view oracledb` cho `latest` là 26.0.0.
- db-orm:
  - typeorm-repo: mở được.
- db-timeouts:
  - pg-set: mở được.
  - np-pool: mở được.
  - np-client: mở được.
- Không mở lại, vì câu dẫn không đổi so với vòng 2: pg-protocol-overview, pg-protocol-flow, np-types, np-pg-types, np-queries, pg-query-source, mdn-max-safe, typeorm-find, typeorm-patterns, pg-client-config, pg17-client-config, pg-signal, aws-timeouts.
- Giới hạn: WebFetch trả nội dung qua mô hình trích xuất, nên tôi chưa đọc văn bản thô toàn trang. Release Notes chỉ đọc 100.000 trên 166.547 ký tự đầu. Ý về native network encryption được xác nhận trực tiếp ở Appendix A: bảng 32.1 ghi Thin là "No", mục 32.2.1.8 ghi "does not support".

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| db-timeouts | 109 | minor | B.6 | "sau `commit` giữ tới hết session" bỏ điều kiện của nguồn: "unless overridden by another `SET`". `supports` của pg-set có giữ điều kiện này, và lab tự dùng `reset` ở cuối bước 9. | Thêm "trừ khi có `set` khác ghi đè" khi xử lý nhóm tồn. |
| db-timeouts | 109, 135, 137 | minor | E.15 | Câu mới nêu `set` thường giữ tới hết session nhưng không nói hệ quả với pool, trong khi đây là lý do chính để chọn `set local`. Dòng 135 còn viết "đặt riêng cho phiên đó". Phép thử của tôi ngoài lab (`pool.max = 1`, `pg-pool` 3.14.0): sau `set` thường rồi `commit` và `release`, lần mượn lại cùng backend trả `300ms`; với `set local` thì trả `0`. | Ở nhóm tồn, thêm bước vào lab rồi thêm một câu nói giá trị đi theo kết nối sang lần mượn sau. Bài chưa được trích số đo này vì nó chưa nằm trong `lab/experiments/`. |
| db-timeouts | 56, 105 | minor | B.7 | Major về `pg-pool` đã xử lý đủ ở thân bài (dòng 148, 153) và README, nhưng còn sót hai chỗ. `version` của np-pool vẫn ghi "lab dùng pg 8.16.3", trong khi `pg` khai `pg-pool` là `^3.10.1`. Bảng dòng 105 xếp `connectionTimeoutMillis` vào "driver `pg`". | Sửa `version` thành "lab dùng `pg` 8.16.3, `pg-pool` 3.14.0". Sửa ô trong bảng thành "`pg-pool`". |

Tổng: 0 blocker, 0 major, 3 minor.

Ghi chú:
- **5 major của vòng 2:** cả 5 đã xử lý đúng.
  - `db-drivers`: dòng 134 và `version` dòng 77 ghi 26.0.0, khớp Release Notes và npm.
  - `db-orm` dòng 60: có "Lab với TypeORM 1.1.2, `pg` 8.16.3 cho thấy:". Số khớp output bước 9, 12, 13.
  - `db-orm` dòng 106: đã ghi là kết quả lab và bỏ `[^typeorm-repo]`. Trang này không nói `save` đọc trước, nên bỏ là đúng. Nguồn vẫn được dùng ở dòng 81, 90, 92.
  - `db-timeouts` dòng 109: mỗi vế đều khớp nguyên văn pg-set. Lab bước 9 phân biệt được hai lệnh sau `commit`: `0` với `set local`, `300ms` với `set` thường.
  - `db-timeouts`: `pg-pool` 3.14.0 và Node.js v24.22.2 đã có ở bài và README, khớp lockfile, `node_modules`, `node --version` và dòng 4 của `output.txt`.
- **Mâu thuẫn:** phần đã đổi không mâu thuẫn với phần còn lại của ba bài.
  - Không còn sót `25.2.1` hay pid `177` trong bài hoặc README của `db-timeouts`.
  - `db-drivers` và `db-orm` vẫn ghi v25.2.1, khớp output của chính chúng.
  - Không có bài nào khác nhắc tới `set local`, kể cả ba bài `aidev-*`, nên không có trùng lặp. Các câu về `connectionTimeoutMillis` ở `db-connection-pool` khớp.
- **Validate:** `176 chủ đề (skeleton: 146, draft: 6, verified: 24) · 0 lỗi · 0 cảnh báo`. Ba bài đủ 7 mục, `changelog` có đủ dòng cho từng vòng và mô tả đúng thay đổi.
- **Lab:**
  - Khối "Kết quả thật" trong README trùng `output.txt`.
  - Tôi chạy lại `run.mjs` trên `lab-postgres-1` với Node.js v24.22.2. Sau khi bỏ mốc thời gian và pid, kết quả trùng `output.txt`.
  - `lab/node_modules/pg-pool/index.js` dòng 344 gỡ `idleListener` khi cho mượn, khớp câu ở dòng 148.
  - Schema `exp_to` đã xóa, cây làm việc vẫn sạch.
  - Script phép thử pool: `C:\Users\lam.npn\AppData\Local\Temp\claude\D--lam-nguyen-Projects-fullstack-mindmap\1cfaf2e8-8dbf-44f5-b74d-c1ce04b942f7\scratchpad\r3\pool-set.mjs`.
- **Ngoài phạm vi, không tính vào Tổng:** `db-orm` có 6 câu hỏi tự kiểm tra (dòng 135–140), vượt mức 3–5 của E.17.
  - Câu thứ sáu được thêm ở 540de18 (vòng 1), hai vòng trước không nêu, và validator không kiểm điểm này.
  - Trong các bài `verified` tôi đếm được, không bài nào quá 5 câu.
  - Cần quyết trước khi đặt `verified`: bỏ một câu, hay ghi vào nhóm tồn và chấp nhận lệch E.17.

### Xử lý

Cả 3 minor giữ nguyên, chuyển sang nhóm tồn. Lý do chung: vòng 3 là vòng cuối, sau vòng này không viết câu mới.

- `db-timeouts` dòng 109: giữ nguyên, thêm "trừ khi có `set` khác ghi đè" ở nhóm tồn.
- `db-timeouts` dòng 109, 135, 137: giữ nguyên. Hệ quả với pool cần bước lab riêng trước khi viết, vì phép thử của người phản biện không nằm trong `lab/experiments/`.
- `db-timeouts` dòng 56, 105: giữ nguyên, sửa `version` của np-pool và ô trong bảng ở nhóm tồn.

Ghi chú ngoài phạm vi về số câu hỏi của `db-orm`: đã sửa. Xóa câu về `int8` (thêm ở vòng 1), bài còn 5 câu theo điểm 17 của checklist. Không có câu mới, và năm câu còn lại đã qua vòng 2 và vòng 3. Ý về `int8` vẫn có ở mục Cơ chế và mục Lỗi thường gặp.

Kết luận vòng: sạch.

## Vòng 3 — 02/11/2026 — nhóm B
Bài: aidev-repo-context, aidev-reviewing-ai-code, aidev-tests-as-guardrails

Nguồn đã mở:
- cc-memory: mở được. Đã đọc các mục Size, Import, AGENTS.md, Auto memory và "My CLAUDE.md is too large" (WebFetch và bản Markdown thô).
- cc-best: mở được, đọc toàn văn bản thô.
- cc-changelog: mở được, đọc đầu trang và hai mục về `AGENTS.md`.
- agents-md, gh-review-ai, google-review, google-small-cls: mở được, qua trích xuất của WebFetch, so các câu bài trích.
- perry-2023: mở được, chỉ trang arXiv. Không mở lại PDF, vì phần đổi không trích và vòng 2 đã so số liệu với PDF.
- this-repo-claude, release-script, pages-workflow: mở được (file ở HEAD).

`npm run validate`: `176 chủ đề (skeleton: 146, draft: 6, verified: 24) · 0 lỗi · 0 cảnh báo`. Không có lỗi hay cảnh báo cho ba bài.

Xét 2 major của vòng 2: cả hai đã xử lý đúng.
- **Import (`aidev-repo-context` dòng 108–113):** câu mới khớp cc-memory, ở cả mục Size lẫn mục khắc phục sự cố. `supports` đã cập nhật đúng theo.
- **Phiên bản (cả ba bài):** đã ghi trong câu và trong `version`, đúng vị trí vòng 2 đề xuất. Mục đầu changelog là 2.1.316, ngày October 31, 2026. `npm view` cũng cho bản `latest` là 2.1.316, sửa đổi ngày 31/10/2026.

Không có mâu thuẫn mới với phần còn lại của bài. `db-drivers`, `db-orm`, `db-timeouts` không nhắc tới Claude Code hay các bài `aidev`. Dòng changelog vòng 2 của cả ba bài đúng với diff. Dòng soạn bài của `aidev-reviewing-ai-code` khớp nguyên văn bản ở b50e4ed. Dòng 86 của `aidev-repo-context` khớp changelog (2.1.277, September 18, 2026).

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| aidev-repo-context | 108 (đối chiếu 90, 129) | minor | B6, E15 | "Có hai cách để file ngắn lại" đọc như danh sách đủ. Mục "My CLAUDE.md is too large" của cc-memory còn nêu "trim content that isn't needed in every session", và `/doctor` đề xuất cắt. Chính bài cũng dạy bỏ dòng ở phép thử hai câu. "Hai cách" đúng với việc chuyển nội dung đi, chưa đúng với việc làm file ngắn. Không sai cơ chế. | Nhóm tồn: "Ngoài việc bỏ dòng không qua phép thử, có hai chỗ để chuyển nội dung ra khỏi file:". |
| aidev-repo-context | 5, 113 | minor | A3 | Sửa major làm mở lại minor dòng 5 của vòng 1. Gạch đầu dòng đã xóa là chỗ duy nhất nói cách đưa tài liệu sẵn có cho agent. Câu mới chỉ nói import để sắp xếp. `summary` vẫn có "tài liệu", còn thân bài chỉ nhắc README ở dòng 88 và 142. | Nhóm tồn: thêm một câu có nguồn về cách cho agent biết tài liệu nằm ở đâu mà không import cả file. |
| aidev-tests-as-guardrails | 84, 96, 103, 122, 137 | minor | B7, B8 | Ghi bản ở dòng 84 đúng đề xuất vòng 2, nhưng câu đó chỉ gắn với ý "Claude dừng khi việc trông có vẻ xong". Bài không có câu phủ toàn bài như dòng 79 của `aidev-repo-context`. Vì vậy `/goal`, `Stop` hook, giới hạn tám lần và `/verify` không ghi bản ngay tại câu của chúng. Không xếp major vì cùng một trang tài liệu, các câu đều gắn `[^cc-best]`, và `TopicArticle.tsx` dòng 137 hiện `version` của nguồn. | Nhóm tồn: thêm câu phủ toàn bài như dòng 79 của `aidev-repo-context`. |
| aidev-repo-context, aidev-reviewing-ai-code, aidev-tests-as-guardrails | repo-context 44; reviewing 50; tests 52 | minor | B5, C11 | `title` của cc-changelog là "Claude Code Docs — Changelog", còn trang thật có tiêu đề "Claude Code changelog". Các nguồn Claude Code khác theo mẫu "Claude Code Docs — <tiêu đề trang>". | Nhóm tồn: đổi thành "Claude Code Docs — Claude Code changelog". |

Tổng: 0 blocker, 0 major, 4 minor.

Ghi chú:
- **Ngoài phạm vi, không tính vào Tổng:** `aidev-reviewing-ai-code` dòng 112 viết "Agent dừng khi việc trông có vẻ xong[^cc-best]", trong khi nguồn chỉ nói về Claude. Vòng 1 đã nêu đúng lỗi này ở `aidev-tests-as-guardrails`, và bài đó đã sửa. Dòng này không nằm trong diff, nên nên đưa vào nhóm tồn.
- **Không sửa file nào trong repo.** Cây làm việc vẫn sạch sau khi chạy validate.

### Xử lý

Cả 4 minor giữ nguyên, chuyển sang nhóm tồn, cùng lý do với nhóm A:

- `aidev-repo-context` dòng 108: giữ nguyên, nêu việc bỏ dòng cùng hai chỗ chuyển nội dung ở nhóm tồn.
- `aidev-repo-context` dòng 5, 113: giữ nguyên, thêm cách cho agent biết tài liệu nằm ở đâu ở nhóm tồn.
- `aidev-tests-as-guardrails` dòng 84, 96, 103, 122, 137: giữ nguyên, thêm câu phủ toàn bài về ngày đọc và phiên bản ở nhóm tồn.
- Ba bài `aidev`, nguồn `cc-changelog`: giữ nguyên, đổi `title` thành "Claude Code Docs — Claude Code changelog" ở nhóm tồn.

Ghi chú ngoài phạm vi về `aidev-reviewing-ai-code` dòng 112: chuyển sang nhóm tồn.

Kết luận vòng: sạch.

## Việc tồn cho chặng sau

Số dòng theo báo cáo của từng vòng, nên kiểm lại khi sửa.

Từ nhóm tồn, vòng 1 (6 minor):

- `db-query-plan` dòng 79: khôi phục ý cột phụ thuộc không thu hẹp kết quả, sửa "hệ số đó".
- `db-lsm-tree` dòng 104: viết "Khi bạn đặt filter policy, tức cấu hình cách tạo filter, mỗi file SST tạo mới có một Bloom filter; lab này không đặt."
- `lab/README.md` và `learn-lab`: extension cần superuser, tạo role cần `CREATEROLE`.
- `learn-lab` dòng 175: tách superuser thành gạch đầu dòng riêng, kèm thông báo thật `permission denied to create extension "pageinspect"`.
- `pg-btree-impl`: `supports` nhắc dedup của CREATE INDEX; đặt `checkedAt: 2026-11-02` cho ba nguồn.
- `db-transaction-acid` dòng 134, 136: "phần đầu của lab trên PostgreSQL 16 (yêu cầu `approved`, 0 dòng lịch sử)".

Từ nhóm A:

- `db-drivers` dòng 130, 61: "có thể dùng `BigInt`", sửa `supports` theo.
- `db-drivers` dòng 117: "mảng tham số khác rỗng".
- `db-drivers` dòng 19, 26: bổ sung hai điều kiện vào `supports`.
- README `db-drivers`: thêm `pg-types` 2.2.0 vào mục Môi trường.
- `db-orm` dòng 97: "một số câu `SELECT` phụ (lab bước 3, bước 5 SQL 3)".
- `db-orm` dòng 104, 134: nói `update()` nhận điều kiện và nhiều id, kèm `[^typeorm-repo]`.
- `db-orm` dòng 77, `db-timeouts` dòng 102: dùng đúng tiêu đề "Vấn đề N+1", "Locking và deadlock".
- `db-timeouts` dòng 122: thêm "p50 là trung vị".
- `db-timeouts` dòng 109: thêm "trừ khi có `set` khác ghi đè".
- `db-timeouts` dòng 109, 135, 137: thêm bước lab cho thấy `set` thường đi theo kết nối sang lần mượn sau từ pool, rồi thêm một câu vào bài.
- `db-timeouts` dòng 56, 105: `version` của np-pool ghi thêm `pg-pool` 3.14.0, ô bảng đổi thành "`pg-pool`".

Từ nhóm B:

- `aidev-repo-context`: thống nhất "session" và "phiên"; giải thích `managed setting`, `sandbox`.
- `aidev-repo-context` dòng 97: "Hook là script" hẹp hơn nguồn.
- `aidev-repo-context` dòng 95: "công cụ luôn áp dụng" và giới hạn của `Stop` hook.
- `aidev-repo-context` dòng 77: cách nạp `AGENTS.md` của Claude Code, `.claude/CLAUDE.md`, session không đọc được `AGENTS.md`.
- `aidev-repo-context` dòng 108: nêu việc bỏ dòng cùng hai chỗ chuyển nội dung.
- `aidev-repo-context` dòng 5, 113: cách cho agent biết tài liệu nằm ở đâu mà không import cả file.
- `aidev-reviewing-ai-code` dòng 112: "Agent dừng khi…" đổi về "Claude", đúng với nguồn.
- `aidev-tests-as-guardrails` dòng 101, 102, 105: phần trùng với `aidev-reviewing-ai-code`.
- `aidev-tests-as-guardrails` dòng 118: tách ý giá trị mong đợi khỏi `[^gh-review-ai]`.
- `aidev-tests-as-guardrails` dòng 94, 128: biến `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`.
- `aidev-tests-as-guardrails` dòng 84, 96, 103, 122, 137: thêm câu phủ toàn bài về ngày đọc và phiên bản.
- Ba bài `aidev`, nguồn `cc-changelog`: đổi `title` thành "Claude Code Docs — Claude Code changelog".
- `aidev-writing-specs`: đối chiếu lại với trang best practices hiện hành (các ví dụ đã đổi từ 15/10).

Từ chặng 3:

- `db-lsm-tree/run.py`: đọc phiên bản bằng `importlib.metadata.version` ở lần chạy lại sau.
- `db-normalization/run.mjs` dòng 21: ghi chú "Giống một màn hình…" ở lần chạy lại sau.
- Chặng 6: harness dừng khi máy chủ không phải PostgreSQL 16.
