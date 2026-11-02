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
