# Hoàn thiện và kiểm chứng bài học theo chặng

Ngày: 29/10/2026 · Người yêu cầu: Lam · Người viết: Claude

## 1. Ý định

Lam chưa bắt đầu học. Lam muốn có nội dung hoàn chỉnh trước, khi có thời gian thì học từ chặng 1. Theo `CLAUDE.md`, từ 15/10/2026 Claude được giao viết và kiểm chứng bài; việc học vẫn do Lam.

Hiện có 176 chủ đề trong 30 chặng:

- 15 bài đã kiểm chứng (`verified`);
- 5 bài nháp (`draft`), cả 5 thuộc chặng 3;
- 156 bài khung (`skeleton`).

Còn 161 bài phải đưa lên `verified`.

Lam đã chọn ba điều (29/10/2026):

1. Làm lần lượt theo chặng, từ chặng 1 đến chặng 30.
2. Giữ nguyên khuôn bài hiện tại: 7 mục cố định, cùng độ dài và độ sâu như các bài đã kiểm chứng (khoảng 7.000–16.000 ký tự, ví dụ `db-mvcc`).
3. Cách làm: theo chặng, phản biện theo nhóm (mục 4).

## 2. Mục tiêu, không làm, thất bại nếu

**Mục tiêu**

1. Mọi chủ đề của chặng 1–30 lên `verified` với `verifiedBy: claude`, đúng quy tắc nội dung trong `CLAUDE.md`.
2. Checklist kiểm chứng nằm trong repo (mục 6), để mọi phiên sau dùng chung một tiêu chuẩn.
3. Sau mỗi chặng có một bản release chạy được trên artifact và GitHub Pages. Như vậy Lam có thể bắt đầu học bất cứ lúc nào, dù các chặng sau chưa xong.

**Không làm**

- Không đổi cấu trúc app, lộ trình, cây chủ đề hay id chủ đề: không thêm, bớt hay dời chủ đề và chặng. Chỉ sửa code khi việc viết bài cần (ví dụ cổng lab ở mục 5.1).
  - Được sửa câu chữ của `title`, `summary` hay `goal`/`practice` của chặng trong hai trường hợp: nguồn cho thấy câu đó sai (ví dụ hạn mức SerpApi), hoặc câu đó mâu thuẫn với quyết định Lam đã đưa ra (ví dụ học tự do, không gắn lịch).
  - Mỗi chỗ sửa được ghi trong báo cáo chặng (5.8) để Lam đổi lại nếu muốn. Đây là quyết định của Claude.
- Không học thay Lam: không đánh dấu tiến độ học, không ghi vào `data/users/me` ngoài bước đọc kiểm tra sau release.
- Không viết lại 15 bài đã kiểm chứng. Ngoại lệ: 4 góp ý câu chữ còn treo (mục 5.1), và mục "Đào sâu" cho chủ đề lặp lại ở chặng sau (mục 7.4).
- Không xây app thực hành thay Lam.

**Thất bại nếu, dù chạy được**

- Một bài có nhận định, số liệu, log, công ty hay kịch bản không có thật hoặc không có trong nguồn đã đọc.
- Một bài lên `verified` mà vòng phản biện gần nhất còn lỗi blocker hoặc major chưa xử lý.
- Lab ghi kết quả không phải output nguyên văn của một lần chạy thật.
- Release làm mất dữ liệu học của Lam.
- Lộ khóa API hay mật khẩu thật trong repo công khai.

## 3. Ràng buộc

- **Quy tắc nội dung trong `CLAUDE.md`:**
  - nguồn phải đã mở đọc, không dùng snippet tìm kiếm;
  - hành vi sản phẩm kèm tên và phiên bản;
  - ví dụ chỉ từ thực tế;
  - không đổi id chủ đề.
- **Validator** (`npm run validate`):
  - 7 tiêu đề đúng thứ tự;
  - `[^id]` phải khớp `sources`;
  - `[ex:id]` phải khớp `examples`;
  - ví dụ `lab-run` cần `README.md`;
  - bài `verified` cần `verifiedAt`, `verifiedBy` và ít nhất một nguồn.
- **Lab chạy trên máy Lam bằng Docker 29.8** theo `lab/docker-compose.yml` (PostgreSQL 16, Oracle Free theo profile). Máy Lam có sẵn dịch vụ Windows `postgresql-x64-17` đang giữ cổng 5432, nên container lab phải dùng cổng khác. Không dừng hay sửa dịch vụ đó.
- **Claude không được tạo tài khoản hay đăng nhập dịch vụ bên ngoài** (Azure, SerpApi, cổng thanh toán). Không có lab chạy trên các dịch vụ đó. Ví dụ lấy từ tài liệu chính thức hoặc case công khai. Nếu Lam tự chạy và gửi lại output thì kết quả đó được dùng làm `practice-measurement`.
- **Release theo `CLAUDE.md`**, làm như hai lần release ngày 29/10: build từ bản clone này, publish artifact, kiểm tra `data/users/me`, ghi `releases.md` và `releases/last-good/`, push `main`, chép source về `MindMap` rồi so md5.

## 4. Các cách đã cân nhắc

1. **Mỗi bài một vòng phản biện riêng.** Kỹ nhất cho từng bài, nhưng tốn khoảng 161 vòng phản biện. Người phản biện chỉ thấy một bài nên không phát hiện được chỗ trùng hay mâu thuẫn giữa các bài cùng chặng.
2. **Theo chặng, phản biện theo nhóm. Lam chọn cách này.** Viết hết bài của một chặng, rồi mỗi agent phản biện một nhóm tối đa 5 bài. Số vòng phản biện giảm 3–5 lần, và người phản biện thấy được quan hệ giữa các bài. Đổi lại, nhóm dài dễ sót lỗi nhỏ, nên giới hạn 5 bài.
3. **Viết nháp toàn bộ trước, kiểm chứng sau.** Bị loại: Lam chưa học nên phủ nhanh không đem lại gì. Nháp chưa có lab và chưa qua phản biện thì lúc kiểm chứng phải đọc lại nguồn lần nữa.

## 5. Quy trình

### 5.1 Chuẩn bị một lần, trước chặng 1

1. Tạo `docs/kiem-chung.md` chứa checklist ở mục 6, và mẫu báo cáo phản biện ở mục 5.5. Sửa `CLAUDE.md`: thay "mục 6 của plan" bằng đường dẫn `docs/kiem-chung.md`.
2. Cho container PostgreSQL của lab chạy được cạnh dịch vụ PostgreSQL 17 của Lam. Ví dụ: đổi cổng trong `lab/docker-compose.yml` thành `${LAB_PG_PORT:-5433}:5432` và cập nhật `lab/README.md` để `PGPORT` khớp. Chạy thử một lab cũ (`db-mvcc`) để chắc môi trường dùng được. Không ghi đè output đã lưu của lab đó.
3. Sửa 4 góp ý câu chữ mức minor còn treo ở 3 bài đã kiểm chứng, từ vòng phản biện cuối ngày 29/10. Các bài này đi cùng đợt phản biện của chặng 1, như một nhóm riêng.
   - `db-normalization.md:76`: câu nói lab "áp quy tắc" 3NF, nhưng lab không nhắc gì tới 3NF. Đổi thành "Áp quy tắc này vào bảng yêu cầu của lab".
   - `db-schema-data-model.md:137`: trong lab, chữ "schema" có thể bị hiểu là namespace `exp_hr`/`exp_it`. Ghi rõ "theo nghĩa bài dùng".
   - `db-transaction-acid.md:81`: câu hiện tại nói nhẹ hơn điều lab cho thấy. Lab tái hiện cả trạng thái nửa vời, không chỉ thao tác gồm nhiều lệnh.
   - Dòng `changelog` ngày 29/10 của `db-normalization` và `db-schema-data-model` mô tả chưa sát thay đổi.

### 5.2 Viết bài, cho từng bài trong chặng

1. Đọc frontmatter khung (summary, prerequisites, related), mục tiêu (`goal`) và bài thực hành (`practice`) của chặng trong `content/roadmap.yaml`, cùng các bài đã kiểm chứng liên quan. Mục đích là không viết trùng và không mâu thuẫn với chúng.
2. Tìm nguồn và mở đọc toàn văn bằng WebFetch. Thứ tự ưu tiên:
   - tài liệu chính thức của sản phẩm, đúng phiên bản;
   - đặc tả (RFC, W3C, ECMA);
   - case công khai do chính tổ chức công bố;
   - nghiên cứu gốc.
   Mỗi nguồn ghi `supports` bằng lời của Claude, tóm đúng điều nguồn nói; `checkedAt` là ngày đọc.
3. Viết đủ 7 mục, theo giọng và độ sâu của các bài đã kiểm chứng. "Câu hỏi tự kiểm tra" là câu hỏi vận dụng, trả lời được từ bài và lab, không phải câu hỏi học thuộc.
4. Ghi một dòng `changelog`: "Claude soạn bài…".
5. Đổi `contentStatus` sang `draft`. Bài chỉ lên `verified` ở bước 5.6.

### 5.3 Lab

- Viết lab cho mọi chủ đề có hành vi chạy thử được trên máy Lam: database, HTTP, runtime JavaScript, TypeScript, Git, container, thư viện Node. Lab theo mẫu `lab/experiments/<id>/`:
  - `run.mjs`;
  - `output.txt` nguyên văn;
  - `README.md` có câu hỏi, môi trường (phiên bản và nơi chạy), lệnh chạy lại, kết luận chỉ từ output, và giới hạn.
- Thêm service hay package cho lab khi chặng cần, ví dụ Redis và MongoDB ở chặng 5 như ghi chú sẵn trong `docker-compose.yml`. Cố định phiên bản.
- Chủ đề không chạy thử được (khái niệm kiến trúc, quy trình sự cố, dịch vụ Azure, cổng thanh toán) dùng tài liệu chính thức hoặc case công khai. Không có ví dụ thì ghi "Chưa có ví dụ thực tế".
- Lab của 5 bài nháp chặng 3 đã chạy ngày 16/10, giữ nguyên. Chỉ chạy lại khi phản biện nghi ngờ kết quả hoặc khi sửa thử nghiệm. Chạy lại thì thay cả output, kết luận và số liệu trong bài.

### 5.4 Tự đối chiếu

Claude chạy checklist (mục 6) trên từng bài và chạy `npm run validate`. Bài nào chưa đạt thì sửa trước khi giao phản biện.

### 5.5 Phản biện theo nhóm

- Chia các bài của chặng thành nhóm tối đa 5 bài, giữ các bài liên quan trong cùng nhóm.
- Mỗi nhóm giao cho một agent mới, không có ngữ cảnh của phiên viết. Agent nhận:
  - đường dẫn `docs/kiem-chung.md`;
  - các file bài và thư mục lab của nhóm;
  - danh sách các bài khác trong chặng, để kiểm tra trùng lặp và mâu thuẫn.
- Agent phải tự mở các nguồn được trích để so với câu trong bài, không tin `supports`.
- Báo cáo phản biện có, cho từng phát hiện:
  - bài;
  - vị trí;
  - mức độ (blocker, major, minor);
  - mục checklist bị vi phạm;
  - đề xuất sửa.
- Mức độ:
  - **blocker**: sai sự thật, bịa ví dụ, số không khớp nguồn hay output, vi phạm quy tắc `CLAUDE.md`;
  - **major**: thiếu nguồn cho nhận định quan trọng, thiếu phiên bản, cơ chế mô tả sai một phần, câu hỏi tự kiểm tra không trả lời được từ bài, mâu thuẫn với bài khác;
  - **minor**: câu chữ, cách trình bày.
- Claude sửa mọi blocker và major. Sau đó một agent mới khác phản biện lại những bài có sửa. Lặp đến khi vòng gần nhất không còn blocker hay major.
- Minor: sửa nếu nhanh, nếu không thì ghi lại trong báo cáo.
- Lưu báo cáo mỗi vòng vào `docs/reviews/chang-NN.md` (cùng một file cho mọi vòng của chặng). Đây là bằng chứng cho điều kiện "vòng phản biện độc lập gần nhất sạch" trong `CLAUDE.md`.
- Một bài qua 3 vòng vẫn còn blocker hoặc major thì để ở `draft`, ghi lý do trong báo cáo và báo Lam. Chặng vẫn release với bài đó ở trạng thái nháp.

### 5.6 Đặt kiểm chứng

Bài qua phản biện thì đặt:

- `contentStatus: verified`;
- `verifiedBy: claude`;
- `verifiedAt` là ngày vòng phản biện sạch;
- mỗi vòng phản biện một dòng `changelog`, theo mẫu các bài trước ("Phản biện vòng 2: …").

### 5.7 Release

Release theo `CLAUDE.md` sau khi xong mỗi chặng. Ngày 29/10/2026 Lam cho phép publish artifact và push `main` sau mỗi chặng mà không cần hỏi lại. Nếu một bước của release lỗi thì vẫn dừng và báo Lam, như `CLAUDE.md` quy định. Commit nội dung theo từng bước (viết, sửa sau phản biện, kiểm chứng), như lịch sử ngày 29/10.

### 5.8 Báo Lam

Cuối mỗi chặng, Claude báo Lam:

- các bài đã lên `verified`;
- các bài còn ở nháp và lý do;
- lab mới;
- các minor để lại;
- link release.

Lam không cần duyệt từng bài.

## 6. Checklist kiểm chứng (nội dung của `docs/kiem-chung.md`)

Dựng lại từ `CLAUDE.md`, validator và cách 15 bài đã kiểm chứng được làm. Bản gốc "mục 6 của plan" không còn: không có trong repo, trong lịch sử git từ commit đầu ngày 27/10, hay trong `MindMap`.

**A. Cấu trúc**

1. `npm run validate` không báo lỗi cho bài.
2. Đủ 7 mục đúng thứ tự. Mục "Đào sâu", nếu có, nằm cuối bài.
3. `summary` khớp nội dung bài.

**B. Nguồn**

4. Mọi nhận định quan trọng (định nghĩa, cơ chế, con số, hành vi mặc định, giới hạn, khuyến nghị) có `[^id]`.
5. Mỗi nguồn đã được mở đọc toàn văn. `supports` nói đúng điều nguồn nói, không suy rộng.
6. Câu trong bài không nói mạnh hơn nguồn. Điều chỉ suy ra từ lab thì ghi là kết quả lab, không gắn nguồn.
7. Hành vi sản phẩm ghi tên và phiên bản, trong bài và trong `product`/`version` của nguồn. Nguồn đúng phiên bản được nói tới.
8. Bài `volatility: fast` (cloud, AI): nguồn là bản hiện hành tại `checkedAt`. Giá, hạn mức hay tên dịch vụ có thể đổi thì ghi kèm ngày.

**C. Ví dụ**

9. Mọi ví dụ thuộc một trong các loại:
   - `public-case` do chính tổ chức công bố;
   - `official-doc`;
   - `research`;
   - `lab-run`;
   - `practice-measurement`.
   Không có thì ghi "Chưa có ví dụ thực tế".
10. Không có kịch bản, công ty, log hay số liệu tự nghĩ, kể cả khi gắn nhãn minh họa.
11. Con số, ngày, tên trong bài khớp nguyên văn nguồn hoặc `output.txt`.

**D. Lab**

12. README ghi câu hỏi, môi trường (phiên bản, nơi chạy, ngày chạy) và lệnh chạy lại. `output.txt` là output nguyên văn.
13. Kết luận chỉ nói điều output cho thấy. Điều không đo được nằm ở mục giới hạn.
14. Không có khóa API hay mật khẩu thật. Mật khẩu `lab` của môi trường lab là ngoại lệ đã có.

**E. Nội dung học**

15. Cơ chế giải thích được "vì sao", không chỉ "là gì". Phần đánh đổi nêu cả lúc không nên dùng.
16. Lỗi thường gặp có dấu hiệu nhận biết cụ thể: thông báo lỗi, chỉ số, triệu chứng.
17. Có 3–5 câu hỏi tự kiểm tra, buộc phải vận dụng, trả lời được từ bài hoặc lab.
18. Không trùng lặp hay mâu thuẫn với bài khác. Phần đã có ở bài khác thì liên kết qua `related` hoặc `prerequisites` thay vì viết lại.
19. Thuật ngữ tiếng Anh giữ nguyên, giải thích ở lần đầu dùng. Câu ngắn, rõ.

**F. Metadata**

20. `prerequisites` và `related` trỏ tới chủ đề có thật và hợp lý. Id không đổi.
21. `changelog` có một dòng cho lần soạn và một dòng cho mỗi vòng phản biện.

## 7. Trường hợp riêng

1. **Chặng 1.** Bốn bài về cách học và về chính app:
   - `learn-six-questions`;
   - `learn-using-mindmap`;
   - `learn-practice-case`;
   - `learn-lab`.
   Vẫn theo khuôn 7 mục. Nguồn có thể là file trong repo công khai trên GitHub (`README.md`, `lab/README.md`, bản thiết kế), tài liệu SerpApi và Azure (`learn-practice-case`), và nghiên cứu gốc về cách học (`learn-six-questions`). Ví dụ cho các bài này có thể là chính lab hay chính app, miễn là có thật.
2. **Chặng 2.** Đã xong, bỏ qua.
3. **Chặng 3.** 5 bài nháp đi thẳng vào bước 5.4, không viết lại.
4. **Chủ đề lặp lại ở chặng sau.** Ví dụ `aidev-writing-specs` ở chặng 1 và 28, `be-idempotency` ở chặng 15 và 24. Bài được viết ở lần xuất hiện đầu. Ở chặng sau, nếu `goal` của chặng đòi hỏi nhiều hơn bài đang có thì thêm mục "Đào sâu" cuối bài. Mục mới qua phản biện như bài mới trong nhóm của chặng đó. Không thì để nguyên.
5. **AI và coding agent** (chặng 25–29, cùng `db-vector-search`). Có lab gọi model thật hay không, Lam sẽ quyết khi tới chặng 25 (Lam chọn ngày 29/10/2026). Các lựa chọn:
   - API key của Lam, đặt trong `lab/.env` không commit;
   - không có lab gọi LLM;
   - model chạy trên máy bằng Docker.
   Trước lúc đó, không viết lab nào gọi LLM. `db-vector-search` ở chặng 6 vẫn có thể có lab pgvector, vì lab đó không cần tài khoản.
6. **Cloud** (chặng 19–20). Không có lab Azure. Ví dụ từ tài liệu Microsoft, ghi rõ tên dịch vụ và ngày đọc.
7. **Thanh toán** (chặng 24). Không dùng tài khoản cổng thanh toán. Lab chỉ mô phỏng cơ chế chạy được ở máy, ví dụ idempotency key trên PostgreSQL. Ví dụ ngoài lab lấy từ tài liệu chính thức của cổng thanh toán hoặc case công khai.
8. **`learn-weekly-schedule`** có tiêu đề "Lịch học 6–8 giờ mỗi tuần", và summary chia thời gian cho việc biên soạn. Cả hai mâu thuẫn với hai quyết định của Lam: học tự do, và Claude biên soạn. Khi tới chặng của bài này, Claude sửa tiêu đề và summary theo mục 2. Con số "6–8 giờ" chỉ được giữ nếu Lam xác nhận.
9. **Ví dụ từ bài thực hành.** Lam chưa làm app nên chưa có `practice-measurement`. Bài có thể nhắc bài thực hành của chặng như việc cần làm, nhưng không dùng nó làm ví dụ hay đưa số liệu về nó.

## 8. Thứ tự và khối lượng

Số bài cần làm ở mỗi chặng (khung + nháp):

| Chặng | Số bài | Chặng | Số bài | Chặng | Số bài |
|---|---|---|---|---|---|
| 1 | 4 | 11 | 7 | 21 | 11 |
| 2 | 0 | 12 | 8 | 22 | 4 |
| 3 | 5 | 13 | 6 | 23 | 5 |
| 4 | 6 | 14 | 3 | 24 | 7 |
| 5 | 9 | 15 | 8 | 25 | 6 |
| 6 | 10 | 16 | 4 | 26 | 4 |
| 7 | 8 | 17 | 3 | 27 | 8 |
| 8 | 6 | 18 | 8 | 28 | 4 |
| 9 | 3 | 19 | 8 | 29 | 3 |
| 10 | 4 | 20 | 3 | 30 | 2 |

Một số chủ đề có mặt ở hai chặng; ô của chặng sau vẫn đếm chúng, dù ở đó chúng chỉ có thể được thêm mục "Đào sâu" (7.4). Mỗi chặng là một đợt và kết thúc bằng một release. Chặng có 9–11 bài có thể kéo sang phiên sau. Lam chỉ cần nói "làm chặng tiếp theo".

## 9. Để lại cho người thực hiện

- Cách chia nhóm phản biện trong một chặng. Giữ các bài liên quan cùng nhóm, tối đa 5 bài.
- Chọn nguồn cụ thể và thiết kế từng lab.
- Cách cụ thể để lab tránh cổng 5432, miễn là không đụng dịch vụ PostgreSQL 17 của Lam.
- Mô hình cho agent phản biện. Đề xuất: mô hình mạnh nhất có, cụ thể là Opus.
- Khi nào minor đáng sửa ngay.
