# Phản biện chặng 3

Nhóm A: 5 bài nháp của chặng 3 (`db-index-basics`, `db-query-plan`, `db-btree`, `db-lsm-tree`, `db-access-patterns`), soạn ngày 16/10/2026. Trước vòng 1, Claude bỏ câu mở đầu "Màn hình 'Yêu cầu của tôi'…" ở `db-index-basics` và `db-access-patterns` (kịch bản dựng từ bài thực hành cũ, không phải thực tế) và thay bằng mô tả lab.
Nhóm tồn: các minor để lại từ chặng 1 (mục "Việc tồn cho chặng sau" trong `docs/reviews/chang-01.md`), cùng dòng gợi ý chạy lại trong 17 README lab.

Mỗi vòng do một agent mới (Opus) thực hiện theo prompt ở `docs/kiem-chung.md`.

## Vòng 1 — 29/10/2026 — nhóm tồn
Bài: db-transaction-acid, db-normalization, learn-practice-case, learn-lab, 17 README lab PostgreSQL (lab/experiments/*/README.md, dòng 11)
Nguồn đã mở: pg-tx-tutorial: mở được · aca-pricing: mở được (tải toàn bộ HTML bằng curl, 548 KB, rồi đọc phần Consumption plan và FAQ) · mm-roadmap: mở được (content/roadmap.yaml ở HEAD 973dab2, chặng 19) · lab-harness: mở được (lab/lib/harness.mjs ở HEAD) · lab-article: mở được (src/components/TopicArticle.tsx dòng 206) · compose-services: mở được (trang không ghi phiên bản Compose cho cả trang, chỉ ghi cho từng tính năng) · lab/experiments/db-transaction-acid/output.txt và db-normalization/output.txt: đã đọc · docs/reviews/chang-01.md (phần "Bằng chứng: chạy lab với cổng sai" và vòng 2, vòng 3): đã đọc · frontmatter của cloud-managed-identity, cloud-key-vault, cloud-iam-rbac, cloud-container-apps: đã đọc · mở thêm để đối chiếu, bài không dẫn: learn.microsoft.com/azure/container-apps/billing: mở được.

Đã tự kiểm lại trên máy này: `docker compose version` cho "Docker Compose version v5.5.1". Lệnh `node --version` cho v25.2.1. Lệnh `PGPORT=5499 node experiments/db-mvcc/run.mjs` in `# MVCC và VACUUM trên PostgreSQL` rồi dừng với `AggregateError [ECONNREFUSED]`, không có dòng `Máy chủ:`, mã thoát 1. Kết quả khớp câu ở learn-lab dòng 171.

`git diff 34aee2b 33e8353` xác nhận vòng 2 có viết lại câu hỏi 3 và đổi thành "Cả 17 README". Vậy phần bổ sung trong changelog dòng 100 là đúng.

Có 17 lab gọi harness, cả 17 README đều đã đổi dòng gợi ý. db-lsm-tree đúng là lab không dùng PostgreSQL.

`requests_flat(id, title, requester_email, department_name)` khớp output.txt dòng 19.

`npm run validate`: 176 chủ đề (skeleton 152, verified 19, draft 5), 0 lỗi, 0 cảnh báo. Không có lỗi hay cảnh báo nào cho các bài này.

Đã đối chiếu, không thấy mâu thuẫn: tiêu chí Đã hiểu ở learn-using-mindmap dòng 155 và supports của learn-six-questions dòng 42. db-schema-data-model không có chỗ nào trùng với phần đã đổi.

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| learn-practice-case | 124 | major | B.6, E.15 | Câu mới "Replica không hoạt động được tính ở mức giá idle thấp hơn" bỏ mất điều kiện mà chính nguồn ghi: "When an application scales down to its minimum number of replicas, usage is charged at a reduced idle rate when a replica is inactive" (aca-pricing). `supports` dòng 50 có điều kiện này, nhưng thân bài thì không. Trang Learn về billing cũng ghi: khi revision chạy nhiều hơn số replica tối thiểu thì mọi replica tính giá active. Vì vậy câu trong bài sai với trường hợp app đang chạy trên mức tối thiểu. Câu cũng không nói "không hoạt động" nghĩa là gì. | Viết: "Khi app đã thu về số replica tối thiểu, replica không hoạt động (không xử lý request, dùng dưới 0,01 vCPU, nhận dưới 1.000 byte mỗi giây) được tính giá idle thấp hơn[^aca-pricing]". Nếu muốn nêu thêm ý "trên mức tối thiểu thì mọi replica tính giá active", thêm trang Learn billing làm nguồn. |
| learn-practice-case | 124 | minor | B.6 | Vế "chứ không theo mức app dùng thật" là cách bài đọc chữ "allocated" ở phần Consumption plan. Cùng trang đó, phần FAQ lại viết "the number of vCPU-s and GiB-s your applications consume". Vế này cũng dễ làm người đọc hiểu rằng mức dùng thật không ảnh hưởng gì tới tiền. Thực ra mức dùng thật quyết định replica tính giá active hay idle. | Viết "tính theo lượng được cấp (allocated) cho replica…; mức dùng thật chỉ quyết định replica tính giá active hay idle". Nên dẫn thêm trang Learn billing, vì trang đó định nghĩa rõ "amount of resources allocated to each replica while it's running". |
| db-transaction-acid | 132; changelog 84 | minor | E.19, F.21 | Dòng 132 vẫn viết "giống hệt khi không dùng transaction", đúng cách nói mà nhóm tồn muốn bỏ. Changelog dòng 84 thì ghi rằng đã "thống nhất với câu nhắc lab". Changelog còn ghi tiêu đề ví dụ và câu hỏi dùng "không có BEGIN (mỗi lệnh tự commit)", nhưng chỉ dòng 138 có phần trong ngoặc. Ngoài ra, ngay dưới "Không có `BEGIN`" (dòng 138), dòng 139 vẫn viết "Có transaction:". | Đổi dòng 132 thành "giống hệt khi chạy không có `BEGIN`". Có thể đổi dòng 139 thành "Có `BEGIN`:". Sửa changelog cho khớp đúng những chỗ đã đổi. |
| db-transaction-acid | 138 | minor | B.6 | Theo pg-tx-tutorial, mỗi câu lệnh được bọc `BEGIN` và "(if successful) `COMMIT`". "Mỗi lệnh tự commit" đứng ngay trước "lệnh thứ hai vi phạm `NOT NULL`" nên đọc theo nghĩa đen thì cả lệnh lỗi cũng commit. | Viết "(mỗi lệnh thành công tự commit)" hoặc "(mỗi lệnh là một transaction riêng)". |
| lab/experiments/db-transaction-acid/README.md | 3, 18 | minor | E.18, E.19 | Tiêu đề ví dụ `lab-acid` (bài dòng 56) nay là "có và không có BEGIN". README mà ví dụ này trỏ tới vẫn hỏi "khi có và không có transaction" và kết luận "Không có transaction: …". `output.txt` thì ghi "Không dùng transaction: mỗi lệnh tự commit", và phần này không được sửa. | Sửa câu hỏi và kết luận trong README theo cách nói mới. Giữ nguyên `output.txt`. |
| learn-lab | 61 (supports compose-services); changelog 100 | minor | B.5, F.21 | Thân bài (dòng 125) đã tách v5.5.1 thành kết quả lệnh, và hai trường `version` đã sửa đúng. Nhưng `supports` của compose-services vẫn viết "máy của Lam dùng Docker Compose v5.5.1 (lệnh docker compose version, 29/10/2026)". Trang Docker không nói điều này. Vì vậy changelog dòng 100 ("không gắn vào nguồn tài liệu") chỉ đúng một phần. | Bỏ câu về máy của Lam khỏi `supports`, chỉ giữ "Tài liệu bản hiện hành" cùng các ý của trang. |
| learn-lab; 17 README lab | learn-lab 171; README dòng 11 | minor | D.12, E.16 | Gợi ý mới chỉ nói đặt `PGPORT`, và `PGUSER`, `PGPASSWORD` nếu khác `lab`. Harness còn mặc định `database: process.env.PGDATABASE ?? 'lab'` (harness.mjs dòng 14). Một PostgreSQL 16 có sẵn thường không có database `lab`, nên làm theo gợi ý vẫn có thể lỗi kết nối. Lỗi này harness không bắt. | Thêm `PGDATABASE` vào gợi ý ở cả 17 README và ở dòng 171, ví dụ "(và PGUSER, PGPASSWORD, PGDATABASE nếu khác lab)". |
| lab/lib/harness.mjs (việc tồn) | 61–70 | minor | D.12 | Việc tồn "cân nhắc thêm vào `header()` một bước dừng khi máy chủ không phải PostgreSQL 16" chưa được xử lý. harness.mjs không đổi, và không có lý do nào được ghi. | Làm việc này, hoặc ghi "giữ nguyên" kèm lý do trong phần Xử lý của docs/reviews/chang-03.md. |

Tổng: 0 blocker, 1 major, 7 minor.

### Xử lý

- learn-practice-case dòng 124 (major): đã sửa: giá idle chỉ áp khi app đã về số replica tối thiểu; ghi điều kiện replica không hoạt động theo trang giá (không khởi động, không xử lý request, không quá 0,01 vCPU và không quá 1.000 byte mỗi giây). Không thêm trang Learn billing vì câu chỉ dựa vào trang giá đã dẫn.
- learn-practice-case dòng 124 (minor): đã sửa: "được cấp (allocated) cho replica…; mức dùng thật quyết định replica tính giá active hay idle".
- db-transaction-acid dòng 132, 138, 139 và changelog (2 minor): đã sửa: "không có `BEGIN`", "(mỗi lệnh là một transaction riêng)", "Có `BEGIN`"; changelog nhóm tồn viết lại cho khớp.
- README lab db-transaction-acid (minor): đã sửa câu hỏi và kết luận; `output.txt` giữ nguyên.
- learn-lab supports compose-services (minor): đã sửa: bỏ ý về máy của Lam.
- learn-lab và 17 README, PGDATABASE (minor): đã sửa.
- harness.mjs, bước dừng khi không phải PostgreSQL 16 (minor): giữ nguyên: rủi ro thấp (PostgreSQL 17 trên máy Lam không có role `lab`, lab đặt tên schema bắt đầu bằng `exp_`), và muốn làm đúng thì cần thử với một PostgreSQL khác phiên bản trong container. Để chặng 6 (vận hành database), khi lab có dịp dựng thêm phiên bản.

Kết luận vòng: cần vòng sau.

## Vòng 2 — 29/10/2026 — nhóm tồn
Bài: db-transaction-acid, learn-practice-case, learn-lab, lab/experiments/db-transaction-acid/README.md (câu hỏi và kết luận), 17 README lab PostgreSQL (dòng gợi ý chạy lại)

Nguồn đã mở (đọc ngày 02/11/2026; tiêu đề giữ theo mẫu):
- pg-tx-tutorial: mở được.
- ora-transactions: mở được.
- aca-pricing: mở được (tải HTML bằng curl, đọc phần Consumption plan, chú thích Active usage và FAQ).
- compose-services: mở được.
- lab-harness (lab/lib/harness.mjs, cùng lab/lib/requests-1m.mjs), lab-readme, mm-roadmap (chặng 6, 19): mở được ở HEAD 3dacb3f.
- lab/experiments/db-transaction-acid/output.txt và run.mjs: đã đọc.
- 17 run.mjs: đã rà bằng grep các lệnh kết nối, tạo schema, role, extension.
- docs/reviews/chang-03.md: đã đọc phần nhóm tồn.
- Mở thêm để đối chiếu, bài không dẫn: learn.microsoft.com/azure/container-apps/billing, PostgreSQL 16 contrib, pgstattuple, pageinspect: mở được.
- Không mở lại các nguồn khác vì câu dẫn chúng không đổi sau vòng 1.

Kiểm phát hiện vòng 1:
1. **learn-practice-case, major (giá idle):** xử lý đúng. Dòng 126 có điều kiện số replica tối thiểu. Bốn điều kiện của replica không hoạt động là phép đảo đúng của câu "A replica enters active mode…" và chú thích ngưỡng 0.01 cores, 1,000 bytes.
2. **learn-practice-case, minor ("allocated"):** xử lý đúng. Không thêm trang Learn billing là hợp lý, vì bảng giá đủ đỡ câu ("are allocated", "when they are running"). Trang Learn cũng nói cùng ý.
3. **db-transaction-acid, minor (cách nói):** đã sửa ở dòng 134, 140, 141, nhưng dòng 134 sinh ra phát hiện 1 dưới đây.
4. **db-transaction-acid, minor ("mỗi lệnh tự commit"):** xử lý đúng. "(mỗi lệnh là một transaction riêng)" khớp nguồn.
5. **README lab, minor:** xử lý đúng. Câu hỏi và kết luận khớp output. "(mỗi lệnh tự commit nếu thành công)" khớp "(if successful) `COMMIT`". `output.txt` không đổi.
6. **learn-lab, minor (supports compose-services):** xử lý đúng. Các ý còn lại khớp trang Docker.
7. **PGDATABASE, minor:** xử lý đúng. 17/17 README và learn-lab dòng 173 khớp nguyên văn. Không còn gợi ý cũ trong lab, content, docs (trừ docs/reviews). Không run.mjs nào ghi cứng tên database; db-connection-pool dùng `config.database`.
8. **harness.mjs, giữ nguyên:** lý do hợp lý.
   - Mọi schema lab đều bắt đầu bằng `exp_` (4 lab qua `makeRequests`); db-connection-pool không tạo schema.
   - Chặng 6 có "vận hành database" trong tiêu đề.
   - Không tự kiểm được ý "PostgreSQL 17 trên máy Lam không có role `lab`", vì không đăng nhập vào PostgreSQL đó.

Số liệu đối chiếu khớp: 23502, 25P02, `approved`/0 dòng lịch sử, `pending`, 180.000, 360.000, 2 triệu, 0,01, 1.000, 17 README. `docker compose version` cho v5.5.1, `node --version` cho v25.2.1.

Đã kiểm mâu thuẫn với learn-using-mindmap và db-normalization: không có. Hai bài này không nói gì về `BEGIN`, tự commit, PGPORT hay idle; tiêu chí Đã hiểu không đổi sau vòng 1.

`npm run validate`: 176 chủ đề (skeleton 152, verified 19, draft 5), 0 lỗi, 0 cảnh báo; không có gì liên quan tới các bài này. Cây làm việc vẫn sạch sau khi chạy.

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| db-transaction-acid | 134 | minor | B.7, E.19 | Mục về Oracle viết "giống hệt khi chạy không có `BEGIN`", không ghi sản phẩm. `BEGIN` ở đây là cách nói của PostgreSQL. Trang Oracle ghi "A transaction begins when the first executable SQL statement is encountered" và không nhắc lệnh BEGIN. Trên Oracle, chạy không có `BEGIN` là trạng thái thường và transaction vẫn mở, nên người đọc có thể hiểu Oracle cần `BEGIN` mới có transaction. Phép so sánh về dữ liệu vẫn đúng nếu đọc theo dòng 132, nên giữ ở minor. Câu này theo đúng đề xuất của vòng 1. | Viết "giống hệt bước một của lab trên PostgreSQL 16". |
| learn-practice-case | 126 | minor | E.19 | "replica" dùng lần đầu ở thân bài tại đây mà không giải thích, trong khi cả đoạn dựa vào nó. "active" cũng chỉ được hiểu gián tiếp qua câu sau. | Thêm chú thích ngắn ở lần đầu, ví dụ "replica (một bản chạy của app)". Trang Learn billing có câu "runs replicas of your application" nếu cần nguồn. |
| learn-practice-case | 126 | minor | B.4 | Hai câu mới (cách tính theo allocated; điều kiện giá idle với 0,01 vCPU và 1.000 byte) không có `[^aca-pricing]` riêng. Dấu nguồn chỉ nằm ở câu về 0 replica. Các con số đúng với nguồn. | Thêm `[^aca-pricing]` sau hai câu đó. |
| db-transaction-acid; learn-practice-case | acid 84, 86; practice-case 78, 80 | minor | F.21 | Gộp hai dòng thì mô tả đúng thay đổi, nhưng phân bổ theo bước thì lệch. Dòng 84 (viết lại) gán cho bước nhóm tồn cả dấu hiệu Oracle, "mỗi lệnh là một transaction riêng" và README, là những việc chỉ làm sau vòng 1. Dòng 86 lại không nhắc dòng Oracle và README. Dòng 78 cũng được thêm "khi đã về số replica tối thiểu", trùng với dòng 80 và không đúng với bản 973dab2. | Chuyển các ý đó sang dòng "Phản biện vòng 1 nhóm tồn" để mỗi dòng ghi đúng việc của bước mình. |
| lab/README.md; learn-lab | lab/README.md 21 (17 README dòng 11); learn-lab 173 | minor | D.12, E.16 | Gợi ý nay nhận `PGUSER` khác `lab` nhưng không nói role đó cần superuser. db-btree và db-mvcc chạy `create extension` với `pageinspect`, `pgstattuple`, hai extension không có trong danh sách trusted của PostgreSQL 16, nên `CREATE EXTENSION` cần superuser. db-connection-pool và db-schema-data-model tạo role đăng nhập ở mức cluster, mật khẩu trùng tên role. Harness in lỗi SQL rồi chạy tiếp, nên script không dừng mà output thiếu bước. Điều này rút ra từ run.mjs và tài liệu, chưa chạy thử với role thường. | Ghi một ý ở lab/README.md dòng 21 và learn-lab dòng 173: dùng PostgreSQL có sẵn thì role phải là superuser, và 2 lab sẽ tạo role `lab_app`, `lab_schema_user`. Không cần sửa cả 17 README. |

Tổng: 0 blocker, 0 major, 5 minor.

### Xử lý

Cả 5 minor giữ nguyên ở chặng này và chuyển sang nhóm tồn của chặng 4 (xem "Việc tồn cho chặng sau" cuối file): sửa bây giờ thì cần thêm một vòng cho phần chữ mới, trong khi không minor nào làm sai nhận định chính của bài.

Kết luận vòng: sạch. `db-transaction-acid` và `db-normalization` giữ `verifiedAt: 2026-10-15`; `learn-practice-case` và `learn-lab` giữ `verifiedAt: 2026-10-29`, vì lần này chỉ phần đã đổi được phản biện.

## Vòng 1 — 29/10/2026 — nhóm A
Agent bị dừng ngày 29/10 vì giới hạn sử dụng và chạy tiếp, hoàn thành ngày 02/11/2026.

Bài: db-index-basics, db-query-plan, db-btree, db-lsm-tree, db-access-patterns

Nguồn đã mở: tất cả đều mở được, không có nguồn nào không mở được.
- **db-index-basics:** pg-indexes-intro, pg-index-types, pg-indexes-examine, pg-createindex, pg-monitoring, ora-indexes: mở được.
- **db-query-plan:** pg-using-explain, pg-planner-stats, pg-indexes-ordering, ora-explain: mở được.
- **db-btree:** ora-indexes, pg-btree-impl, pg-nbtree-readme, pg-pageinspect, pg-index-types, pg-indexes-opclass: mở được.
- **db-lsm-tree:** oneil-lsm, rocksdb-overview, rocksdb-leveled, rocksdb-compaction, rocksdb-bloom, myrocks-pvldb: mở được.
- **db-access-patterns:** ddb-nosql-design, ddb-relational-example, mongodb-data-modeling, pg-indexes-multicolumn, pg-indexes-ordering, pg-index-only-scans, pg-indexes-partial, pg-createindex, pg-prepare: mở được.

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| db-lsm-tree | 96; `supports` của rocksdb-bloom (45) | blocker | B5, B6, C11 | "RocksDB gắn Bloom filter vào mỗi file SST mới" bỏ mất điều kiện của wiki: "when the filter policy is set". "Mặc định tốn khoảng 10 bit mỗi khóa" sai: wiki chỉ dùng 10 bit trong ví dụ cấu hình `NewBloomFilterPolicy(10, false)`. Ở RocksDB v9.8.4, `filter_policy` trong `table.h` mặc định là `nullptr`, tức không có Bloom filter nếu không cấu hình. `run.py` của lab cũng không đặt filter policy. | Sửa thành: khi đặt filter policy, mỗi file SST mới có Bloom filter; ví dụ của wiki dùng khoảng 10 bit mỗi khóa, và đây không phải mặc định. Sửa cả `supports`. |
| db-lsm-tree | 96, 135 | major | B6, E17 | Câu hỏi "vì sao nó không giúp được quét theo khoảng?" khái quát cho mọi Bloom filter, trong khi dòng 96 chỉ nói Bloom filter theo nguyên khóa. Chính myrocks-pvldb và rocksdb-bloom cho thấy prefix Bloom filter giúp quét theo khoảng có điều kiện bằng trên tiền tố. Bài không nhắc prefix Bloom filter. | Thêm một câu về prefix Bloom filter (dẫn myrocks-pvldb). Đổi câu hỏi thành Bloom filter theo nguyên khóa. |
| db-access-patterns | 5 (`summary`), 99, 105, 166 | major | A3, B6, E17, E18 | Dòng 99 khái quát thành mọi "thiết kế dữ liệu và index", rồi dẫn DynamoDB. Nguồn đó lại nói điều ngược lại với RDBMS: có thể tạo mô hình chuẩn hóa trước mà chưa nghĩ tới access pattern, rồi mở rộng sau. Câu trong `summary` cũng tuyệt đối như vậy, lệch với db-normalization dòng 159 ("bắt đầu từ thiết kế đã normalize"). Bài bỏ vế RDBMS này nên câu hỏi dòng 166 về "điểm xuất phát" không trả lời đủ được từ bài. | Giới hạn câu dòng 99 và `summary` vào NoSQL và việc chọn index. Thêm vế RDBMS của nguồn vào dòng 105. |
| db-access-patterns | Lab: README 3 và 62, run.mjs 1 và 11, output.txt 25; bài 128 | major | C10 | Kịch bản màn hình "Yêu cầu của tôi" đã bị commit 973dab2 gỡ khỏi bài vì là kịch bản tự nghĩ, nhưng còn nguyên trong lab. Dòng 128 của bài còn cụm "danh sách chờ duyệt". Không xếp blocker vì số đo là thật, chỉ phần nhãn là tự nghĩ. | Viết lại thành mô tả truy vấn. Vì `output.txt` phải nguyên văn, sửa note trong `run.mjs` rồi chạy lại lab. Đổi dòng 128 thành "truy vấn yêu cầu `pending`". |
| db-btree | 86 | major | C11, E15 | "Mỗi tầng phía trên có ít trang hơn tầng dưới hàng trăm lần" không khớp bảng ngay trên: tầng 0 so với tầng 1 là 2.733/10 ≈ 273 lần, nhưng tầng 1 so với tầng 2 chỉ 10 lần. Trang gốc có 10 mục. | Viết: mỗi trang trong chứa được hàng trăm mục, tầng 1 trung bình 274 mục; trang gốc mới dùng 10 mục. |
| db-index-basics | 108 | minor | E15 | Bài không nói `idx_scan` đứng yên chưa đủ để xóa index. Index của `PRIMARY KEY` và `UNIQUE` còn giữ ràng buộc (db-tables-keys-constraints dòng 16–17). | Thêm một vế loại trừ index giữ ràng buộc. |
| db-index-basics, db-btree | 96; 105 | minor | E19 | Bài nhắc HOT nhưng không giải thích nó là gì. Hai bài và các bài đối chiếu đều không có phần này. | Giải thích một câu ở db-index-basics. |
| db-index-basics, db-query-plan | 120; 87 | minor | B6, D13 | "Số trang ổn định hơn thời gian" không có nguồn. Lab không đo được điều này vì mỗi truy vấn chỉ chạy một lần. README của db-index-basics cũng ghi tương tự. | Ghi là nhận định của bài, hoặc bỏ. |
| db-query-plan | 85 | minor | B4 | Nhận định `EXPLAIN` không chạy câu lệnh thiếu `[^id]`. | Gắn `[^pg-using-explain]`. |
| db-query-plan | 96 | minor | B6 | pg-using-explain không nói về node song song; phần `loops` nói về subplan chạy nhiều lần. Việc áp dụng cho node song song là kết quả lab. | Ghi rõ: tổng 200.000 ở `Gather` là số trong lab bước 3. |
| db-query-plan | 71, 104, 113 | minor | E15 | Câu hỏi dòng 113 hỏi lệnh sửa "cho planner biết điều gì", nhưng bài không nói tới phụ thuộc hàm, tuy pg-planner-stats có. | Thêm một câu: giá trị cột phụ thuộc không thu hẹp thêm kết quả. |
| db-query-plan | Liên quan db-joins 97 | minor | E18 | db-joins dẫn sang bài này cho ý "index trên cột dùng để join là một phần của thiết kế", nhưng bài không bàn về việc đó. | Thêm một câu, hoặc đổi liên kết ở db-joins sang bài Index. |
| db-btree | 70 | minor | B4, E18 | "Vẫn nhanh khi bảng liên tục được chèn thêm" không có nguồn, và căng với db-lsm-tree dòng 74 (chèn liên tục tốc độ cao thì tốn kém). | Viết rõ "vẫn tìm nhanh", hoặc bỏ vế này. |
| db-btree | 90, 120–122 | minor | E15 | Bài dùng 6 trang và 4 trang để minh họa đi dọc trang lá, nhưng hai số này gồm cả trang bảng (`Heap Fetches` 100 và 5). Bài cũng không giải thích vì sao 100 lần vào bảng chỉ tốn vài trang. | Nói rõ số trang gồm cả trang bảng. |
| db-btree | 94 | minor | E19 | `downlink` không được giải thích ở lần đầu dùng. | Thêm "(con trỏ từ trang cha xuống trang con)". |
| db-btree | 96 | minor | B6 | README nói chung thì lượt quét không phải giữ khóa khi đi xuống cây, nhưng PostgreSQL vẫn khóa đọc từng trang lúc đang xem trang đó. Câu của bài dễ hiểu thành không có khóa nào. | Thêm "trừ khóa ngắn trên trang đang đọc". |
| db-btree | 98 | minor | B6, E15 | Bài bỏ điều kiện gộp chỉ chạy khi xóa tuple không giải phóng đủ chỗ. Số đo ngay sau đó lại từ `CREATE INDEX` trên bảng đã có dữ liệu, không phải đường chèn lười. | Thêm điều kiện và nói rõ cách lab dựng index. |
| db-btree | 104, 111, 124 | minor | C11, E15 | Bài không nói rõ `C.UTF-8` không phải locale C chuẩn, nên người học kiểm tra `datcollate` dễ kết luận sai. "(libc)" cũng không có trong output, vì lab không truy vấn provider. | Nêu rõ điểm này. Bỏ "(libc)" hoặc thêm truy vấn `datlocprovider` vào lab. |
| db-btree | 110, 112 | minor | C10, B6 | Dòng `Filter: (title ~~ '%abc'::text)` chưa từng chạy trong lab. Vế `order by title` ở dòng 112 không có trong pg-indexes-opclass. Không xếp blocker vì đây là mô tả dấu hiệu, không trình bày như ví dụ. | Thêm truy vấn đó vào lab hoặc mô tả bằng lời. Ghi vế `order by` là suy luận. |
| db-lsm-tree | 82, 84 | minor | E15 | Tiêu đề "Ghi vào bộ nhớ trước" và mô tả logfile không cho biết WAL giữ dữ liệu của memtable khi hỏng máy. | Thêm một câu về vai trò của WAL, có nguồn. |
| db-lsm-tree | 80 | minor | B7 | Câu này đặt mọi mô tả dưới RocksDB 9.8.4, trong khi wiki không gắn phiên bản; chỉ frontmatter ghi điều đó. | Ghi trong bài: wiki không gắn phiên bản, số đo lab là 9.8.4. |
| db-lsm-tree | 90 | minor | E15 | "Level thấp hơn" dịch sát "lower level", nên dễ đọc thành số nhỏ hơn, ngược với dòng 88. | Viết "level sâu hơn (số lớn hơn)". |
| db-lsm-tree | 94, 98, 104 | minor | E19 | `sorted run`, `read amplification`, `write amplification`, `seek` không được giải thích ở lần đầu dùng. | Thêm giải thích ngắn. |
| db-lsm-tree | 113 | minor | B6 | Bài báo nói về LSM-tree database như RocksDB, không riêng MyRocks. | Sửa cách nói. |
| db-lsm-tree | Lab: `run.py` | minor | D12 | Chuỗi `rocksdict 0.3.25` trong output được viết cứng, không đọc từ gói. `rocksdb_version` thì đọc thật từ file OPTIONS. | Lấy bằng `importlib.metadata.version`. |
| db-access-patterns | 105 | minor | B7 | Câu về MongoDB thiếu phiên bản trong bài; db-normalization ghi "MongoDB 9.0". | Thêm "9.0". |
| db-access-patterns | 139 | minor | B6 | Dấu hiệu "sau khi đưa vào dùng mới phát hiện phải quét cả bảng" là suy luận, không có trong ddb-nosql-design dù gắn `[^id]`. | Chuyển `[^id]` về câu nguồn thật sự nói. |

Tổng: 1 blocker, 4 major, 22 minor.

Ghi chú:
- **Validate:** `npm run validate` ra `176 chủ đề (skeleton: 152, verified: 19, draft: 5) · 0 lỗi · 0 cảnh báo`, không có lỗi hay cảnh báo liên quan tới 5 bài.
- **Phiên bản đã xét:** phản biện trên HEAD `3dacb3f`. Commit này không đổi 5 bài; với lab của chúng, nó chỉ sửa dòng gợi ý biến môi trường trong 4 README (không có db-lsm-tree).
- **Số liệu:** mọi con số còn lại trong 5 bài khớp `output.txt` hoặc nguồn. Không có nghi ngờ nào cần chạy lại lab.
- **Mức đọc nguồn:**
  - oneil-lsm: đọc tóm tắt, phần đầu bài và tra từ khóa.
  - myrocks-pvldb: đọc ngữ cảnh quanh các đoạn được trích.
  - pg-monitoring: chưa đọc 5.889 ký tự cuối.
  - ora-explain: chưa đọc 36.886 ký tự cuối.
  - Các trang còn lại đọc qua trích xuất của WebFetch; riêng hai trang DynamoDB có toàn văn.
  - Phần chưa đọc không chứa câu nào bài trích. Phát hiện blocker đã đối chiếu thêm với bản thô của wiki và `table.h` ở tag `v9.8.4`.

### Xử lý

Blocker và 4 major đã sửa theo đề xuất. Trong 22 minor, 19 đã sửa theo đề xuất, với các ghi chú sau.

- db-access-patterns, lab (major): đổi nhãn trong `run.mjs` và README rồi chạy lại lab trong container `postgres:16` trên máy Lam (ngày 02/11/2026). Số trang và kế hoạch giống hệt lần chạy 16/10, nên không số nào trong bài đổi. README ghi môi trường mới và nói rõ lần chạy cũ.
- db-query-plan dòng 87 và db-index-basics dòng 120 (minor): đã sửa trong bài. README của lab db-index-basics vẫn còn câu tương tự: giữ nguyên ở chặng này vì câu đó nằm trong lab, không phải trong bài, và không làm sai số đo nào; chuyển sang nhóm tồn.
- db-query-plan, liên kết từ db-joins dòng 97 (minor): giữ nguyên ở chặng này vì phải sửa bài đã kiểm chứng; chuyển sang nhóm tồn (đổi liên kết ở db-joins sang bài Index).
- db-lsm-tree, `run.py` (minor): giữ nguyên: `requirements.txt` đã cố định `rocksdict==0.3.25`, nên chuỗi in ra đúng với lần chạy; sửa script thì phải chạy lại lab mà không đổi kết luận nào. Chuyển sang nhóm tồn.

Kết luận vòng: cần vòng sau.

## Vòng 2 — 02/11/2026 — nhóm A
Bài: db-index-basics, db-query-plan, db-btree, db-lsm-tree, db-access-patterns

Nguồn đã mở:
- ddb-nosql-design: mở được
- mongodb-data-modeling: mở được (trang ghi v9.0 Current)
- pg-hot: mở được
- pg-planner-stats: mở được
- pg-using-explain: mở được
- pg-btree-impl: mở được
- pg-nbtree-readme: mở được (bản raw REL_16_STABLE)
- pg-indexes-opclass: mở được
- rocksdb-overview: mở được
- rocksdb-bloom: mở được
- rocksdb-compaction: mở được
- rocksdb-leveled: mở được
- myrocks-pvldb: mở được (tải PDF, trích bằng pdftotext, đọc mục 3.2.2.1, 3.2.2.2 và đoạn về burst writes)
- Trang web và wiki đọc qua trích xuất của WebFetch; mọi câu bài dẫn đều đã so với đoạn trích. Không mở lại các nguồn có câu dẫn không đổi sau vòng 1.

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| db-query-plan | 73 | minor | B4, B6 | "Planner biết giá trị một cột quyết định giá trị cột kia" nói mạnh hơn nguồn. pg-planner-stats ghi `ANALYZE` đo mức phụ thuộc, planner điều chỉnh theo hệ số ("using the dependency coefficients"), và chỉ áp cho điều kiện bằng với hằng và `IN`, không cho khoảng hay `LIKE`. Câu đúng với lab vì phụ thuộc ở đó là hoàn toàn. Câu `CREATE STATISTICS` cũng mất `[^pg-planner-stats]` riêng. | Viết: "Với tùy chọn `dependencies`, `ANALYZE` đo mức phụ thuộc giữa các cột; với điều kiện bằng so với hằng và `IN`, planner dùng hệ số đó để không ước tính thiếu". Gắn lại `[^pg-planner-stats]` cho câu trước. |
| db-btree | 100 (liên quan câu hỏi 134) | minor | B4, E15 | Vế mới "tức không đi qua đường chèn lười" không có `[^id]`. Bài cũng chưa nói `CREATE INDEX` có deduplication, nên người đọc không rõ vì sao index trong lab vẫn nhỏ. pg-btree-impl có câu đỡ: "`CREATE INDEX` and `REINDEX` apply deduplication to create posting list tuples, though the strategy they use is slightly different". | Thêm: "`CREATE INDEX` cũng áp dụng deduplication, theo chiến lược hơi khác[^pg-btree-impl]". |
| db-btree | 92 | minor | E15 | Vòng 1 nêu hai ý, bản sửa mới xử lý một ý. Câu mới đặt `Heap Fetches` 100 cạnh 6 trang mà không giải thích vì sao 100 lần vào bảng chỉ tốn vài trang. | Thêm một vế từ số lab: 100 `id` liên tiếp nằm trên vài trang bảng liền nhau (khoảng 89 dòng mỗi trang, 1.000.000 dòng trên 11.236 trang). |
| db-lsm-tree | 98, 106 | minor | E19 | `filter policy` là thuật ngữ mới, chưa giải thích, và đứng trước câu định nghĩa Bloom filter. `Seek` mới thêm ở dòng 98 nằm trước chú thích seek ở dòng 106, nên chú thích không còn ở lần đầu dùng. | Đưa câu định nghĩa Bloom filter lên trước, giải thích ngắn `filter policy`, chuyển chú thích seek lên dòng 98. |
| db-index-basics | 129 (liên quan 109–110, 128) | minor | C11, E15 | "Thời gian là một lần đo" lệch với bảng ghi 3 lần và README dòng 26 ghi "bước 4 là ba lần". "Bài dựa chủ yếu vào số trang" chỉ đúng phần đọc; phần chi phí ghi dựa hoàn toàn vào thời gian. | Viết: "Thời gian là một lần đo (phần chèn là ba lượt) trên máy build dùng chung; phần đọc so bằng số trang, phần ghi chỉ so tương đối trong cùng lần chạy". |
| db-index-basics (README lab) | README 26; docs/reviews/chang-03.md 160 | minor | D13, quy định phần Xử lý | Xử lý ghi "giữ nguyên" nhưng không nêu lý do, trong khi `docs/kiem-chung.md` yêu cầu "giữ nguyên: lý do…". Việc sửa cũng rẻ, vì README chỉ đổi chữ và không phải chạy lại lab. | Ghi lý do ở dòng 160, hoặc bỏ vế "Số trang (`Buffers`) ổn định hơn thời gian" khỏi README. |

Tổng: 0 blocker, 0 major, 6 minor.

Ghi chú:
- **Phát hiện vòng 1:**
  - Blocker và 4 major đều xử lý đúng. Mọi câu mới khớp nguồn hoặc output, gồm câu về filter policy, 10 bit, prefix Bloom filter, vế RDBMS của DynamoDB và câu so số trang của B-tree.
  - Trong 19 minor đã sửa, 18 đúng. Minor seek gây phát hiện 4 vì câu mới thêm `Seek` trước chú thích. Phát hiện 3 là phần còn lại của minor Heap Fetches, tuy đề xuất vòng 1 không yêu cầu phần này.
- **Lý do giữ nguyên:**
  - `run.py` hợp lý: `requirements.txt` có `rocksdict==0.3.25`.
  - Liên kết db-joins dòng 97 hợp lý: đây là bài đã kiểm chứng, và đích mới có nội dung ở db-index-basics dòng 91.
  - README db-index-basics thiếu lý do (phát hiện 6).
- **Lab db-access-patterns:**
  - So `output.txt` cũ và mới sau khi che số mili giây: chỉ khác dòng phiên bản, thời điểm chạy, NOTICE đầu và hai dòng nhãn đã đổi. Số trang và kế hoạch giữ nguyên.
  - README có khối output giống hệt `output.txt`.
  - Mọi số trong bài khớp output: 1.621, 203, 23, 11.236, 96.774, 1.112 kB, 38 MB, 7, 4.
  - Tôi không chạy lại lab. Môi trường trong README khớp đối chiếu chỉ đọc trên container `lab-postgres-1` hôm nay: 16.15 Debian, `shared_buffers` 128MB, 2 worker, `en_US.utf8`, Docker báo 16 CPU và 15,48 GiB.
  - Tên `pending_list` trong `prepare` vẫn còn. Đây là định danh SQL, không phải kịch bản nên tôi không tính.
- **Changelog:** 5 dòng mới mô tả đúng thay đổi.
- **`npm run validate`:** 176 chủ đề (skeleton 152, verified 19, draft 5), 0 lỗi, 0 cảnh báo; không có gì liên quan tới 5 bài. Cây làm việc vẫn sạch.
- **Mâu thuẫn:** không có với db-tables-keys-constraints (dòng 80–81) và db-normalization (dòng 94, 98). HOT ở db-index-basics khớp db-btree dòng 107.
- **Ngoài bài:** `docs/reviews/chang-03.md` dòng 95 trỏ tới mục "Việc tồn cho chặng sau" cuối file, nhưng mục này chưa có. Cần thêm trước khi đóng chặng.

### Xử lý

- Phát hiện 1–5 (5 minor trong bài): giữ nguyên ở chặng này và chuyển sang nhóm tồn của chặng 4: sửa bây giờ thì cần thêm một vòng cho phần chữ mới, và không minor nào làm sai nhận định chính của bài.
- Phát hiện 6: đã sửa phần Xử lý của vòng 1 (ghi lý do); câu trong README chuyển sang nhóm tồn.
- Mục "Việc tồn cho chặng sau": đã thêm ở cuối file.

Kết luận vòng: sạch. Cả 5 bài lên `verified`, `verifiedBy: claude`, `verifiedAt: 2026-11-02`.

## Việc tồn cho chặng sau

Các việc dưới đây thành nhóm tồn ở chặng 4: sửa rồi phản biện thành một nhóm riêng.

Từ nhóm tồn vòng 2:
- `db-transaction-acid` dòng 134: "giống hệt khi chạy không có `BEGIN`" nằm trong mục về Oracle; viết "giống hệt bước một của lab trên PostgreSQL 16".
- `learn-practice-case` dòng 126: giải thích "replica" ở lần đầu dùng; gắn `[^aca-pricing]` cho hai câu về cách tính tiền và giá idle.
- `db-transaction-acid` dòng 84, 86 và `learn-practice-case` dòng 78, 80: phân lại ý giữa các dòng changelog cho đúng từng bước.
- `lab/README.md` dòng 21 và `learn-lab`: dùng PostgreSQL có sẵn thì role phải là superuser, và 2 lab tạo role `lab_app`, `lab_schema_user`.

Từ nhóm A:
- `db-query-plan` dòng 73: viết lại câu về `dependencies` theo đúng mức của nguồn (đo mức phụ thuộc, dùng hệ số, chỉ với điều kiện bằng và `IN`); gắn lại nguồn.
- `db-btree` dòng 100: thêm "`CREATE INDEX` cũng áp dụng deduplication, theo chiến lược hơi khác".
- `db-btree` dòng 92: giải thích vì sao 100 lần vào bảng chỉ tốn vài trang.
- `db-lsm-tree` dòng 98, 106: đưa định nghĩa Bloom filter lên trước, giải thích `filter policy`, chuyển chú thích seek lên lần đầu dùng.
- `db-index-basics` dòng 129: sửa câu "Thời gian là một lần đo" cho khớp phần ba lượt chèn.
- README lab `db-index-basics` dòng 26: bỏ vế "Số trang (`Buffers`) ổn định hơn thời gian".
- `db-joins` dòng 97: đổi liên kết sang bài Index.
- `lab/experiments/db-lsm-tree/run.py`: đọc phiên bản `rocksdict` bằng `importlib.metadata.version` thay vì viết cứng, ở lần chạy lại lab.
- `lab/experiments/db-normalization/run.mjs` dòng 21: note "Giống một màn hình…" (kịch bản tự nghĩ, ở lần chạy lại lab).

Để chặng 6: bước dừng trong `header()` của `lab/lib/harness.mjs` khi máy chủ không phải PostgreSQL 16.
