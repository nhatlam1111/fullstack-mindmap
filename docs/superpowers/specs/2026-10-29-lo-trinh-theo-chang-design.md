# Lộ trình theo chặng, bốn mảng chủ đề mới và app thực hành nghiên cứu thị trường game

Ngày: 29/10/2026 · Người yêu cầu: Lam · Người viết: Claude

## 1. Ý định

Lam khảo sát 13 JD Senior Fullstack tại TP.HCM trên ITviec (29/10/2026). So với thị trường, mindmap còn thiếu bốn mảng: cloud, kiến trúc ứng dụng, xử lý sự cố production, nghiệp vụ tiền và thanh toán. Lam muốn bổ sung cả bốn.

Lam học theo tốc độ riêng, thấy tự tin thì đi phỏng vấn. Vì vậy lộ trình không còn gắn với lịch 24 tuần.

Lam muốn thay bài thực hành hiện tại (ứng dụng quản lý yêu cầu nội bộ) bằng một app theo sở thích: hệ thống nghiên cứu thị trường game mobile. App chạy trên tài khoản Azure miễn phí và công khai trên GitHub, vừa để học vừa để làm đẹp profile. Lam sẽ dùng kết quả của app để tham khảo trước khi tự làm game đưa lên Google Play.

## 2. Mục tiêu, không làm, thất bại nếu

**Mục tiêu**

1. App mindmap chạy theo chặng do Lam tự chọn: không gắn ngày, không giới hạn số chặng.
2. Thêm 28 chủ đề dạng khung thuộc bốn mảng mới, có chỗ trong cây kiến thức và trong lộ trình.
3. Viết lại lộ trình thành 30 chặng. Bài thực hành xuyên suốt là app nghiên cứu thị trường game:
   - chỉ dùng PostgreSQL;
   - stack TypeScript: NestJS, Next.js, PostgreSQL;
   - triển khai trên Azure.

**Không làm trong thay đổi này**

- Không viết nội dung bài cho chủ đề mới. Các bài vào ở `skeleton`, rồi được viết và kiểm chứng sau theo quy trình thường lệ trong `CLAUDE.md`.
- Không xây app game thay Lam. Việc học do Lam (theo `CLAUDE.md`); thay đổi này chỉ viết đề bài cho từng chặng.
- Không thêm Kubernetes, AWS, GCP. Không thêm nhánh lập trình game, không thêm chặng luyện phỏng vấn. Không còn thực hành Oracle, vì Lam đã có 8 năm kinh nghiệm. Các bài lý thuyết đang so sánh Oracle với PostgreSQL thì giữ nguyên.
- Không đổi id chủ đề hiện có.
- Không viết lại các bài đã kiểm chứng và lab của chúng. Chỉ sửa những câu nhắc tới bài thực hành (mục 5.5).

**Thất bại nếu, dù chạy được**

- App vẫn bám lịch hoặc tạo áp lực tiến độ theo ngày.
- Đề bài dẫn Lam tới việc tự cào dữ liệu Google Play. [Điều khoản Google](https://policies.google.com/terms) (hiệu lực 30/7/2026) nêu việc cào nội dung không thuộc về mình là lý do có thể bị đình chỉ quyền truy cập.
- Đề bài để lộ bí mật như SerpApi key hay chuỗi kết nối database trong repo công khai.
- Dữ liệu học hiện có của Lam bị mất, hoặc chặng hiện tại của Lam bị đặt sai sau khi cập nhật.

## 3. Ràng buộc

- **Quy tắc nội dung trong `CLAUDE.md`:**
  - chủ đề mới ở `skeleton`;
  - ví dụ chỉ lấy từ thực tế;
  - id ổn định, `content/ids.lock` do build tự ghi thêm.
- **Quy trình release trong `CLAUDE.md`:**
  - `npm run release` phải xanh;
  - publish đúng URL artifact và không truyền `capabilities`;
  - đọc thử `data/users/me`;
  - ghi `releases.md` và `releases/last-good/`;
  - đẩy lên GitHub.
- **Bản source gốc (Lam quyết ngày 29/10/2026):** làm và release từ bản clone `D:\lam.nguyen\Projects\fullstack-mindmap`, vì đây là bản mới nhất (commit 27/10). Bản `D:\lam.nguyen\Projects\MindMap` dừng ở 15/10 và thiếu 5 bài Nháp kèm lab: `db-access-patterns`, `db-btree`, `db-index-basics`, `db-lsm-tree`, `db-query-plan`. 5 bài này lên artifact luôn trong lần release này. Ở bước cuối của quy trình release, chép source ngược về `MindMap` như `CLAUDE.md` mô tả. Lần này không sửa `CLAUDE.md`.
- **Dữ liệu học hiện có:** dữ liệu của Lam nằm trong kho dữ liệu của artifact, `meta` có `startDate`. File sao lưu cũ (schemaVersion 1) phải nhập được.
- **SerpApi gói Free** ([pricing](https://serpapi.com/pricing), [Google Play API](https://serpapi.com/google-play-api), đọc ngày 29/10/2026):
  - 250 lượt mỗi tháng, tối đa 50 lượt mỗi giờ;
  - tham số `chart` (ví dụ `topselling_free`, tối đa 50 kết quả), `gl` cho quốc gia, `apps_category`;
  - mỗi app có `rating` và `downloads` dạng mốc chữ (ví dụ "500,000,000+");
  - chưa thử bằng key thật, nên chưa biết có ghép được `chart`, `apps_category` và `gl` trong cùng một lượt gọi hay không.
- **Azure:**
  - [Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/billing) gói Consumption miễn phí mỗi tháng, tính trên mỗi subscription: 180.000 vCPU-giây, 360.000 GiB-giây, 2 triệu request. Có job chạy theo lịch.
  - Chưa xác minh được Azure Database for PostgreSQL flexible server có nằm trong gói miễn phí 12 tháng hay không.
- **Test e2e điều hướng bằng bàn phím** (`tests/e2e/app.spec.ts`) phụ thuộc thứ tự bốn nhánh đầu: web, fe, be, db.

## 4. Các hướng đã cân nhắc: chạy theo tốc độ riêng

| Hướng | Mô tả | Được | Mất |
|---|---|---|---|
| **A. Tự chọn chặng hiện tại (Lam chọn)** | Bỏ ngày bắt đầu, thay bằng "chặng hiện tại" do Lam bấm chuyển hoặc chọn | Vẫn biết bước tiếp theo, không bị lịch thúc | Phải tự bấm chuyển chặng |
| B. Bỏ khái niệm chặng hiện tại | Lộ trình chỉ là danh sách có thứ tự; màn Hôm nay chỉ còn bài cần ôn và bài đang đọc dở | Ít code nhất | App không chỉ cho bước tiếp theo |
| C. Suy chặng từ tiến độ (loại) | Chặng hiện tại là chặng đầu tiên còn bài chưa "Đã hiểu" | Không phải bấm | 133/148 bài còn ở dạng khung, app sẽ kẹt ở chặng có bài chưa viết |

Lam chọn A. Lý do: học tự do và lộ trình dài thêm thì càng cần biết bước tiếp theo.

## 5. Thiết kế đã chốt

### 5.1. App: chặng tự chọn

**Hành vi**

- **Dữ liệu `Meta`:** thêm `currentStage?: number`, cả trong type `Meta` lẫn `MetaSchema` ở `src/store/model.ts`. Giữ `startDate` ở dạng optional để migrate và để file sao lưu cũ vẫn hợp lệ.
- **Migrate một lần:**
  - Nếu `meta.currentStage` chưa có mà `meta.startDate` có, lấy tuần cũ `currentWeek(startDate, today())`, đổi sang chặng mới rồi ghi thành `currentStage` ngay lần mở đầu tiên sau bản cập nhật.
  - Cách đổi:
    - tuần 0 hoặc nhỏ hơn thành chặng 1;
    - tuần 1–15 giữ nguyên số;
    - tuần 16 thành 18, 17 thành 21, 18 thành 23, 19 thành 25, 20 thành 26, 21 thành 27, 22 thành 28, 23 thành 29, 24 và 25 thành 30.
  - Từ đó chặng không còn chạy theo lịch.
  - Đã kiểm ngày 29/10/2026: `data/users/me/meta` trên artifact không có `startDate`, nên Lam trên claude.ai sẽ thấy thẻ chọn chặng. Bước đổi này phục vụ dữ liệu `localStorage` ở GitHub Pages và file sao lưu cũ.
- **Chưa có cả hai trường:** màn Hôm nay hiện thẻ "Chọn chặng bắt đầu", mặc định chặng 1, bấm "Bắt đầu" để ghi `currentStage`.
- **Màn Hôm nay:**
  - dòng phụ "Chặng X/N", không còn khoảng ngày;
  - thẻ "Chặng này" giữ nội dung như thẻ "Tuần này" hiện nay: tiêu đề, mục tiêu, thực hành, mốc kiểm tra, chủ đề, nút "Mở trong lộ trình";
  - thêm nút "Xong, sang chặng X+1", ẩn ở chặng cuối;
  - bỏ hai thông báo "Sắp bắt đầu" và "Đã qua 24 tuần".
- **Màn Lộ trình:**
  - tiêu đề "Lộ trình";
  - lede nói học theo tốc độ riêng và trỏ tới bài thực hành mới (`#learn-practice-case`), bỏ "6–8 giờ mỗi tuần";
  - mỗi chặng không còn khoảng ngày;
  - chặng hiện tại vẫn được đánh dấu như nay, các chặng khác có nút "Học chặng này" để đặt làm chặng hiện tại;
  - tiêu đề giai đoạn ghi "chặng a–b".
- **Thanh trên** (`src/App.tsx`): "Chặng X/N" thay cho "Tuần X/24".
- **Màn Dữ liệu học:** thẻ "Ngày bắt đầu lộ trình" thay bằng "Chặng hiện tại", là một ô chọn 1..N kèm tên chặng và nút Lưu.
- **Nhập file sao lưu:**
  - chế độ thay thế lấy `currentStage` và `startDate` của file;
  - chế độ gộp chỉ đặt `currentStage` khi hiện chưa có;
  - file cũ chỉ có `startDate` thì đi qua bước migrate ở trên.
- **Tiến độ:** `progressOf` giữ nguyên logic. Bài dạng khung được tính khi chặng hiện tại ≥ chặng đầu tiên của bài, tham số giờ là chặng hiện tại.
- **Trang bài:** chip "Chặng N" thay cho "Tuần N"; câu "sẽ được biên soạn vào chặng N".
- **Link:** `#wN` giữ nguyên ý nghĩa, mở chặng N.
- **Validator** (`scripts/lib/content.ts`, `scripts/lib/schema.ts`):
  - bỏ `max(24)`;
  - thay kiểm "đủ 24 tuần" bằng: số chặng liên tục từ 1 tới N, mỗi số đúng một lần, và các giai đoạn phủ đúng 1..N, mỗi chặng một lần.
- **Tên khóa dữ liệu:** giữ `week`/`weeks`/`firstWeek` trong YAML và code, chỉ đổi chữ hiển thị. Đầu `content/roadmap.yaml` ghi chú `week` là số thứ tự chặng.
- **Code thừa:** xóa `weekRange`, `formatDay` (nếu không còn ai dùng) và thẻ chọn ngày.

**Test**

- e2e đầu tiên đổi thành: chọn chặng bắt đầu, thấy "Chặng 1/30" và tiêu đề chặng 1.
- Thêm e2e: bấm "Xong, sang chặng 2" thì thanh trên đổi thành "Chặng 2/30".
- `validate.test.ts`:
  - dựng lộ trình N chặng tùy ý thay cho 24;
  - thêm case bắt lỗi chặng nhảy số (1, 2, 4);
  - case thiếu chặng giữ nguyên ý.
- Unit test cho bước migrate:
  - có `startDate`, không có `currentStage` thì ra chặng đúng;
  - kết quả kẹp trong [1, N];
  - đã có `currentStage` thì không đụng tới.

**Tài liệu:** sửa README (mục `content/roadmap.yaml`: 24 tuần thành các chặng) và chú thích đầu `content/roadmap.yaml`.

### 5.2. Cây kiến thức: 28 chủ đề mới

**Thứ tự nhánh trong `content/branches.yaml`:** web, fe, be, db, **arch**, ops, **cloud**, **pay**, ai, aidev, learn. Bốn nhánh đầu giữ nguyên để test bàn phím không đổi.

**Nhánh `arch` — Kiến trúc ứng dụng** (volatility `slow`)

| Nhóm | id chủ đề | Tiêu đề |
|---|---|---|
| `arch-modules` Cấu trúc ứng dụng | `arch-modular-monolith` | Modular monolith: ranh giới module trong một ứng dụng |
| | `arch-clean-hexagonal` | Clean Architecture và hexagonal (ports and adapters) |
| `arch-ddd` Domain-Driven Design | `arch-ddd-strategic` | DDD chiến lược: bounded context, ubiquitous language, context map |
| | `arch-ddd-tactical` | DDD chiến thuật: entity, value object, aggregate |
| `arch-patterns` Mẫu và quyết định | `arch-cqrs` | CQRS: tách mô hình đọc và ghi |
| | `arch-domain-events-outbox` | Domain event và transactional outbox |
| | `arch-adr` | Ghi quyết định kiến trúc (ADR) |

**Nhánh `ops` — thêm nhóm `ops-incident` Xử lý sự cố**

| id chủ đề | Tiêu đề |
|---|---|
| `ops-incident-response` | Quy trình xử lý sự cố: phát hiện, phân cấp, vai trò, liên lạc |
| `ops-on-call` | On-call và cảnh báo đáng tin |
| `ops-runbook` | Runbook |
| `ops-postmortem` | Postmortem không đổ lỗi |

**Nhánh `cloud` — Cloud (Azure)** (volatility `fast`, vì sản phẩm và gói miễn phí đổi nhanh)

| Nhóm | id chủ đề | Tiêu đề |
|---|---|---|
| `cloud-foundations` Nền tảng và phân quyền | `cloud-shared-responsibility` | Mô hình trách nhiệm chung: IaaS, PaaS, serverless |
| | `cloud-azure-structure` | Tenant, subscription, resource group và region |
| | `cloud-iam-rbac` | Microsoft Entra ID và Azure RBAC |
| | `cloud-managed-identity` | Managed identity và workload identity federation |
| `cloud-run` Chạy ứng dụng và dữ liệu | `cloud-compute-options` | Chọn nơi chạy: App Service, Container Apps, Functions |
| | `cloud-container-apps` | Azure Container Apps: app, revision, scale, job |
| | `cloud-managed-postgres` | Azure Database for PostgreSQL flexible server |
| | `cloud-key-vault` | Azure Key Vault |
| `cloud-ops` Hạ tầng dạng code và chi phí | `cloud-iac` | Infrastructure as code với Terraform |
| | `cloud-monitor` | Azure Monitor và Application Insights |
| | `cloud-cost` | Chi phí, ngân sách và gói miễn phí trên Azure |

**Nhánh `pay` — Tiền và thanh toán** (volatility `slow`)

| Nhóm | id chủ đề | Tiêu đề |
|---|---|---|
| `pay-money` Tiền và sổ cái | `pay-money-representation` | Biểu diễn tiền: đơn vị nhỏ nhất, decimal, làm tròn, tiền tệ |
| | `pay-ledger` | Sổ cái kép (double-entry ledger) |
| `pay-flows` Luồng thanh toán | `pay-payment-lifecycle` | Vòng đời thanh toán: authorize, capture, refund, chargeback |
| | `pay-gateway-integration` | Tích hợp cổng thanh toán: redirect, webhook, chữ ký |
| `pay-ops` Đối soát và tuân thủ | `pay-reconciliation` | Đối soát giao dịch |
| | `pay-compliance` | PCI DSS và dữ liệu thẻ |

**Mỗi chủ đề mới:**
- là một file `content/topics/<nhánh>/<id>.md`, frontmatter theo `TopicFrontmatter`, `contentStatus: skeleton`, không có thân bài;
- có `summary` một câu;
- `related` trỏ tới chủ đề sẵn có liên quan:
  - `ops-config-secrets` cho `cloud-key-vault`;
  - `ops-cost` cho `cloud-cost`;
  - `ops-monolith-microservices` cho `arch-modular-monolith`;
  - `db-distributed-transactions` cho `arch-domain-events-outbox`;
  - `be-idempotency` và `be-webhooks` cho các bài `pay-*`;
  - `ops-slo` và `ops-metrics` cho `ops-on-call`.

**Chủ đề sửa:** `learn-practice-case` giữ id, đổi:
- `title` thành "Case: hệ thống nghiên cứu thị trường game mobile";
- `summary` thành "Bài thực hành xuyên suốt: thu thập bảng xếp hạng game Google Play qua SerpApi, thống kê game lớn nhất và mới nổi, đề xuất thể loại; chạy trên Azure, công khai trên GitHub.";
- thêm một dòng `changelog` ngày 29/10/2026.

### 5.3. App thực hành: hệ thống nghiên cứu thị trường game

Đây là đề bài để Lam tự xây qua từng chặng. Các chi tiết dưới đây là chất liệu để viết phần thực hành của từng chặng.

- **Nguồn dữ liệu:** SerpApi Google Play API, gói Free. Không tự cào trang.
  - Mặc định 5 quốc gia (VN, US, JP, KR, ID) × 2 bảng xếp hạng game (miễn phí và doanh thu cao), chụp mỗi tuần một lần: khoảng 10 lượt mỗi tuần, tức khoảng 43 lượt mỗi tháng. Phần còn lại trong 250 lượt dành cho thử nghiệm.
  - Nếu `chart` không ghép được với danh mục game thì lấy bảng xếp hạng chung và lọc theo trường `category` của từng app.
- **Phạm vi quan sát:** chỉ những game xuất hiện trong top 50 của các bảng xếp hạng đã chụp. Đề bài phải ghi rõ giới hạn này.
- **Game lớn nhất:** mốc lượt tải cao nhất và điểm từ 4 sao trở lên, theo từng quốc gia và gộp chung. Mốc chữ được đổi thành số cận dưới (ví dụ "10,000,000+" thành 10.000.000).
- **Game mới nổi** theo tuần và theo tháng: game vào bảng lần đầu, tăng hạng mạnh, hoặc lên mốc lượt tải cao hơn giữa các lần chụp. Ngưỡng do Lam tự chọn khi làm.
- **Thể loại nổi bật:** tổng hợp các chỉ số trên theo thể loại.
- **Người dùng:**
  - khách xem dashboard công khai, chỉ đọc;
  - admin (Lam) cấu hình quốc gia và bảng xếp hạng, chạy nhập tay.
- **Hạ tầng:**
  - repo công khai trên GitHub, CI/CD bằng GitHub Actions;
  - API và web chạy trên Azure Container Apps;
  - nhập hằng tuần bằng Container Apps job;
  - PostgreSQL managed. Nếu PostgreSQL flexible server không còn miễn phí thì chọn phương án khác ở chặng 19 và ghi ADR;
  - bí mật nằm trong Key Vault, app đọc bằng managed identity;
  - GitHub Actions đăng nhập Azure bằng OIDC federation, không lưu secret của Azure trong GitHub.

### 5.4. Lộ trình 30 chặng

**Giai đoạn** (id đánh lại từ p1; id giai đoạn không được lưu ở đâu khác)

| id | Tên | Chặng |
|---|---|---|
| p1 | Database và dữ liệu | 1–6 |
| p2 | Nền tảng web | 7–9 |
| p3 | Frontend | 10–12 |
| p4 | Backend và tích hợp | 13–15 |
| p5 | Kiến trúc ứng dụng | 16–17 |
| p6 | Container, CI/CD và Azure | 18–20 |
| p7 | Vận hành, bảo mật và kiến trúc hệ thống | 21–23 |
| p8 | Tiền và thanh toán | 24 |
| p9 | AI engineering | 25–27 |
| p10 | Phát triển phần mềm cùng AI | 28–29 |
| p11 | Tổng hợp | 30 |

**Các chặng**

- Chặng 1–15 giữ nguyên tiêu đề, mục tiêu và danh sách chủ đề, trừ chỗ ghi khác ở dưới. Chỉ phần thực hành và mốc kiểm tra được viết lại cho app mới.
- "Cũ N" là số tuần trong `content/roadmap.yaml` hiện tại.

| Chặng | Nguồn | Chủ đề | Thực hành (dàn ý) | Mốc kiểm tra (dàn ý) |
|---|---|---|---|---|
| 1 | cũ 1 | như cũ | Viết spec ngắn cho app (nguồn dữ liệu, quốc gia, bảng xếp hạng, tiêu chí nổi bật), đủ rõ để giao cho coding agent. Tạo tài khoản SerpApi Free, gọi tay một lần lấy JSON bảng xếp hạng game của một quốc gia, lưu làm mẫu và không commit key. Thử luôn việc ghép `chart` với danh mục game. Thiết kế schema PostgreSQL: game, nhà phát triển, thể loại, quốc gia, lần chụp, thứ hạng trong lần chụp, lịch sử điểm và mốc lượt tải; đủ PK, FK, unique, check. | Schema chạy trên PostgreSQL và nạp được JSON mẫu; giải thích được từng constraint và cách tách bảng. |
| 2 | cũ 2 | như cũ | Tái hiện hai tiến trình nhập cùng một lần chụp chạy song song, gây bản ghi trùng hoặc lost update ở bảng tổng hợp. Chặn bằng unique cộng `INSERT ... ON CONFLICT`, bằng `SELECT ... FOR UPDATE` trên dòng lần chụp, và bằng cột version. Ghi lệnh và kết quả thật. | Giải thích Read Committed và Serializable trên PostgreSQL, đối chiếu với Oracle đã biết; chỉ ra chỗ cần khóa. |
| 3 | cũ 3 | như cũ | Sinh khoảng 1 triệu dòng thứ hạng giả lập trong lab. Đo bằng `EXPLAIN ANALYZE` trước và sau khi thêm index: lịch sử hạng của một game, top game tuần theo quốc gia, game tăng hạng mạnh nhất giữa hai lần chụp. | Mỗi index có một truy vấn và một số đo giải thích lý do tồn tại. |
| 4 | cũ 4 | như cũ | API đầu tiên bằng NestJS + TypeScript: danh sách game theo quốc gia và tuần, chi tiết game, lịch sử hạng. Dùng pool; mỗi lần nhập một lần chụp là một transaction ở tầng nghiệp vụ; bind variable; sửa N+1 ở danh sách game kèm thể loại. Phần coding agent giữ như cũ. | Như cũ. |
| 5 | cũ 5 | như cũ | Redis cache "top game tuần theo quốc gia", vô hiệu khi có lần chụp mới. Full-text search của PostgreSQL trên tên và mô tả game. | Như cũ. |
| 6 | cũ 6 | như cũ | Migration có version; backup và restore sang database mới, đo thời gian; thử partition bảng thứ hạng theo tháng và so truy vấn; viết ghi chú lựa chọn database. | Như cũ. |
| 7 | cũ 7 | như cũ | `curl -v` và tab Network tới API; dữ liệu đổi mỗi tuần nên đặt `Cache-Control` và `ETag`, kiểm lại bằng request thứ hai. | Như cũ. |
| 8 | cũ 8 | như cũ | Như cũ. | Như cũ. |
| 9 | cũ 9 | như cũ | Dựng frontend bằng Next.js + TypeScript; định nghĩa kiểu cho dữ liệu API và kiểm tra lúc chạy ở ranh giới API. | Như cũ. |
| 10 | cũ 10 | như cũ | Màn bảng xếp hạng (lọc quốc gia, thể loại) và trang chi tiết game; chạy axe; thao tác hoàn toàn bằng bàn phím. | Như cũ. |
| 11 | cũ 11 | như cũ | Nối API; xử lý loading, error, empty; tái hiện rồi sửa lỗi đổi quốc gia nhanh làm kết quả cũ ghi đè kết quả mới. | Như cũ. |
| 12 | cũ 12 | như cũ | Chọn cách render cho trang báo cáo tuần (SSR, SSG hay ISR, vì dữ liệu đổi mỗi tuần). Form admin thêm quốc gia và bảng xếp hạng cần theo dõi, validation ở cả client và server. Test component, một test e2e, đo Core Web Vitals. | Rà soát nửa chặng đường: tiến độ, bài quá hạn ôn, điều chỉnh các chặng còn lại. |
| 13 | cũ 13 | như cũ | Chuẩn hóa mô hình lỗi chung; OpenAPI sinh từ NestJS. | Như cũ. |
| 14 | cũ 14 | như cũ | Hai vai trò khách và admin; admin đăng nhập bằng OIDC (GitHub hoặc Microsoft Entra ID); test chứng minh khách không gọi được API cấu hình và nhập tay. | Như cũ. |
| 15 | cũ 15 | như cũ | Nhập hằng tuần qua background job: retry, backoff theo giới hạn 50 lượt/giờ, idempotency key là (quốc gia, bảng xếp hạng, tuần). Đẩy tiến độ nhập lên trang admin bằng SSE. Test tích hợp với PostgreSQL thật trong container; contract test với JSON mẫu SerpApi đã lưu. | Chạy lại cùng một job hai lần không tạo lần chụp trùng và không tốn thêm lượt gọi SerpApi. |
| 16 | mới | `arch-modular-monolith`, `arch-ddd-strategic`, `arch-ddd-tactical`, `arch-adr` | Vẽ bounded context của app (thu thập dữ liệu, thống kê, báo cáo và đề xuất, quản trị); tách code NestJS thành module theo context, chặn import chéo bằng luật lint; xác định aggregate; viết ADR đầu tiên. | Không module nào import phần nội bộ của module khác; ADR nêu phương án bị loại và lý do. |
| 17 | mới | `arch-clean-hexagonal`, `arch-cqrs`, `arch-domain-events-outbox` | Đặt nguồn dữ liệu sau một port, với adapter SerpApi và adapter giả cho test. Tách mô hình đọc (bảng hoặc materialized view thống kê) khỏi mô hình ghi (lần chụp thô). Phát sự kiện "đã nhập lần chụp" qua transactional outbox để tính lại thống kê. | Toàn bộ test chạy không gọi SerpApi; dừng tiến trình giữa chừng (thử thật) mà không mất sự kiện. |
| 18 | cũ 16 | như cũ | Dockerfile cho backend và frontend; GitHub Actions chạy lint, test, build; đưa migration vào pipeline; bật secret scanning và push protection cho repo công khai. | Pull request chỉ merge được khi pipeline xanh (branch protection). |
| 19 | mới | `cloud-shared-responsibility`, `cloud-azure-structure`, `cloud-iam-rbac`, `cloud-managed-identity`, `cloud-compute-options`, `cloud-container-apps`, `cloud-managed-postgres`, `cloud-key-vault` | Lam tự tạo tài khoản Azure. Tạo resource group, cấp quyền tối thiểu. Đưa API và web lên Container Apps, database lên PostgreSQL managed; nếu không còn miễn phí thì chọn phương án khác và viết ADR. SerpApi key vào Key Vault, app đọc bằng managed identity. GitHub Actions deploy qua OIDC federation. | App chạy công khai trên Azure; không có mật khẩu hay khóa nào trong repo hoặc biến pipeline; giải thích được ai có quyền gì. |
| 20 | mới | `cloud-iac`, `cloud-monitor`, `cloud-cost` | Viết lại toàn bộ hạ tầng bằng Terraform; xóa resource group rồi dựng lại từ code. Container Apps job chạy nhập hằng tuần. Application Insights cho API và job. Đặt ngân sách và cảnh báo chi phí. | Dựng lại được toàn bộ môi trường từ code; job chạy đúng lịch; cảnh báo ngân sách hoạt động. |
| 21 | cũ 17 | như cũ | Log có cấu trúc kèm correlation id, metric và trace (OpenTelemetry tới Application Insights); phân loại dữ liệu trong schema và chặn dữ liệu cá nhân lọt vào log; rà OWASP Top 10; bật Dependabot. | Như cũ. |
| 22 | mới | `ops-incident-response`, `ops-on-call`, `ops-runbook`, `ops-postmortem` | Đặt cảnh báo khi job nhập thất bại hoặc API trả 5xx; viết runbook "job nhập thất bại". Diễn tập: trên môi trường thử, cố ý thu hồi quyền đọc Key Vault của job rồi xử lý theo runbook. Viết postmortem không đổ lỗi cho lần diễn tập, hoặc cho sự cố thật nếu đã gặp. | Cảnh báo tới được bạn; postmortem có dòng thời gian, nguyên nhân gốc, hành động khắc phục có người làm và hạn. |
| 23 | cũ 18 | như cũ | ADR cho cách triển khai, cache, nguồn dữ liệu và nơi đặt database; timeout và retry có giới hạn cho lời gọi SerpApi. | Như cũ. |
| 24 | mới | `pay-money-representation`, `pay-ledger`, `pay-payment-lifecycle`, `pay-gateway-integration`, `pay-reconciliation`, `pay-compliance`, `be-idempotency` | Thử nghiệm riêng ngoài app, chỉ PostgreSQL. Dựng sổ cái kép (tài khoản, bút toán, dòng bút toán) với ràng buộc bảo đảm mỗi bút toán cân bằng. API ghi nhận thanh toán có idempotency key, thử gửi trùng. Đối soát một file quyết toán do Lam tự tạo với sổ cái, liệt kê các dòng lệch. | Không ghi được bút toán lệch; gửi trùng không tạo hai giao dịch; đối soát chỉ ra đúng các dòng lệch đã cài sẵn. |
| 25 | cũ 19 | như cũ | LLM viết báo cáo xu hướng tuần với structured output: thể loại đang lên, game tiêu biểu kèm số liệu lấy từ database, lý do. Đầu ra không hợp lệ thì rơi vào nhánh fallback có log. | Như cũ. |
| 26 | cũ 20 | như cũ | Embedding mô tả game lưu trong pgvector; tìm game tương tự; so với full-text search ở chặng 5 trên cùng bộ câu hỏi. | Như cũ. |
| 27 | cũ 21 | như cũ | Bộ eval có đáp án cho báo cáo tuần, kiểm số liệu trích dẫn có khớp database; đo chi phí và độ trễ; thử prompt injection qua mô tả game (nội dung từ store là không tin cậy) và thêm lớp phòng vệ. | Như cũ. |
| 28 | cũ 22 | như cũ | Spec tính năng "so sánh thị trường giữa hai quốc gia"; giao cho coding agent; review diff và ghi lại lỗi gặp phải. | Như cũ. |
| 29 | cũ 23 | như cũ | Như cũ, áp vào app mới. | Như cũ. |
| 30 | cũ 24 | như cũ | Hoàn thiện app; README trên GitHub nêu kiến trúc, các ADR, số đo thật, link bản chạy trên Azure; viết retro toàn lộ trình. | Rà toàn bộ mindmap: tỷ lệ Đã hiểu, bài quá hạn ôn, bài quá hạn rà soát. |

**Ghi chú cho phần viết lại**

- Mọi chỗ nhắc Oracle, ứng dụng quản lý yêu cầu nội bộ, GitLab CI hay Vite trong phần thực hành và mốc kiểm tra phải được thay.
- Chú thích đầu `content/roadmap.yaml` phải nói đúng ba điều: bài thực hành mới, học theo chặng, `week` là số thứ tự chặng.

### 5.5. Bài đã kiểm chứng đang nhắc app cũ (Lam quyết ngày 29/10/2026)

Bốn bài đã kiểm chứng nhắc tới bài thực hành cũ:

| Chỗ | Nội dung hiện tại |
|---|---|
| `aidev-writing-specs.md:109` | Câu hỏi tự kiểm tra về đặc tả "ứng dụng quản lý yêu cầu nội bộ" ở "bài thực hành tuần 1" |
| `db-schema-data-model.md:133` | Câu hỏi tự kiểm tra "lấy ví dụ từ bài thực hành quản lý yêu cầu" |
| `db-normalization.md:72` | Đoạn "Áp vào bài thực hành" |
| `db-transaction-acid.md:77` | "Duyệt một yêu cầu trong bài thực hành…" |

- **Cách sửa:** chỉ sửa đúng các câu đó để chúng không còn gắn với app nào cụ thể. Ví dụ: "Duyệt một yêu cầu trong bài thực hành" thành "Trong lab ở mục Ví dụ, duyệt một yêu cầu".
  - Câu hỏi tự kiểm tra phải trả lời được bằng kiến thức trong bài, không cần biết app thực hành là gì.
  - Không đụng nguồn, nhận định hay ví dụ.
- **Lab:** giữ nguyên, kể cả `lab/lib/requests-1m.mjs` và các lab dùng kịch bản yêu cầu và duyệt. Lab minh họa cơ chế và có output thật, không phụ thuộc vào bài thực hành.
- **Trạng thái:** 4 bài giữ `verified`, `verifiedBy` và `verifiedAt` không đổi. Mỗi bài thêm một dòng `changelog` ngày sửa.
- **Điều kiện:** trước khi release, chạy một vòng phản biện độc lập chỉ trên các đoạn đã sửa. Nếu vòng này còn lỗi mức blocker hoặc major chưa xử lý thì bài đó về `draft`, theo quy tắc trong `CLAUDE.md`.
- **Chỗ khác:** rà thêm toàn bộ `content/` và `lab/` xem còn câu nào nhắc "bài thực hành" theo nghĩa app cũ. Nếu có thì xử lý cùng cách.

## 6. Phần để người làm tự quyết

- Câu chữ tiếng Việt cuối cùng của tiêu đề, mục tiêu, thực hành, mốc kiểm tra từng chặng, theo dàn ý ở mục 5.4. Tiêu đề và mục tiêu chặng 1–15 có thể chỉnh nhẹ cho khớp app mới.
- `summary` một câu và `related`/`prerequisites` chi tiết của từng chủ đề mới, theo gợi ý ở mục 5.2. Không tạo vòng lặp "cần học trước".
- Chi tiết giao diện: vị trí nút, câu chữ, kiểu ô chọn chặng. Giữ đúng hành vi ở mục 5.1 và qua axe.
- Thứ tự chủ đề trong từng chặng.
- Cách viết bước migrate (trong selector hay khi tải dữ liệu), miễn là chỉ ghi một lần và không ghi đè `currentStage` đã có.

## 7. Release

Theo quy trình trong `CLAUDE.md`, nhưng bước 1 đóng gói từ bản clone `fullstack-mindmap` thay vì `MindMap` (mục 3). Sau khi publish:

- đọc `data/users/me` và các bản ghi meta để chắc dữ liệu học còn nguyên, và `currentStage` đã được suy đúng từ `startDate` của Lam;
- `releases.md` ghi số chủ đề khung/nháp/đã kiểm chứng mới (hiện có 128/5/15; thêm 28 bài khung thành 156/5/15 nếu chưa bài nào đổi trạng thái).

## 8. Các quyết định do Claude đưa ra (Lam kiểm khi đọc)

1. Ứng dụng quản lý yêu cầu nội bộ được thay hẳn, không chạy song song hai app.
2. Phần thanh toán học qua chủ đề cộng một thử nghiệm riêng ngoài app.
3. Frontend dùng Next.js thay cho Vite + React (JD nhắc Next.js nhiều).
4. IaC dùng Terraform thay cho Bicep (2/13 JD nhắc Terraform, không JD nào nhắc Bicep).
5. Mặc định 5 quốc gia VN, US, JP, KR, ID và 2 bảng xếp hạng game, chụp mỗi tuần.
6. Admin đăng nhập bằng OIDC (GitHub hoặc Entra ID); không có tài khoản người dùng thường.
7. Các nhánh mới xếp sau `db` để giữ test bàn phím; volatility: cloud `fast`, arch `slow`, pay `slow`.
8. Giữ tên khóa `week` trong dữ liệu, chỉ đổi chữ hiển thị thành "chặng".
9. Chặng suy từ ngày bắt đầu cũ được ghi một lần thành `currentStage` theo bảng đổi tuần cũ sang chặng mới, sau đó không chạy theo lịch nữa.
10. Không thêm K8s, chặng luyện phỏng vấn hay nhánh lập trình game.
