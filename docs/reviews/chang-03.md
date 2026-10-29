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
