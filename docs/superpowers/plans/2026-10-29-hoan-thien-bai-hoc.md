# Hoàn thiện và kiểm chứng bài học theo chặng — kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Mục tiêu:** đưa toàn bộ chủ đề của chặng 1–30 lên `verified` (`verifiedBy: claude`), mỗi chặng một đợt và kết thúc bằng một bản release.

**Cách làm:**
- Task 1–2 dựng nền chung: checklist và quy trình trong `docs/kiem-chung.md`, cổng lab không đụng PostgreSQL 17 của Lam.
- Task 3–6 làm chặng 1, kèm 4 góp ý câu chữ còn treo. Task 6 viết ra quy trình release dùng lại cho mọi chặng.
- Task 7 làm chặng 3. Task 8–34 làm chặng 4–30, mỗi task một chặng, theo quy trình chung cộng ghi chú riêng của chặng.

**Công cụ:**
- Nội dung: Markdown và YAML, kiểm bằng `npm run validate`.
- Lab: Node 22, driver `pg` 8.16.3, Docker Compose với PostgreSQL 16.
- Publish: công cụ Artifact và ArtifactData. Đẩy mã: `git` và `gh`.

**Spec:** `docs/superpowers/specs/2026-10-29-hoan-thien-bai-hoc-design.md`

## Global Constraints

- Quy tắc nội dung trong `CLAUDE.md` là bắt buộc:
  - nguồn đã mở đọc, không dùng snippet, gắn `[^id]`;
  - hành vi sản phẩm kèm tên và phiên bản;
  - ví dụ chỉ từ thực tế, không có thì ghi "Chưa có ví dụ thực tế";
  - không đổi id chủ đề.
- Chỉ đặt `contentStatus: verified` kèm `verifiedBy: claude` khi bài đã qua checklist và vòng phản biện độc lập gần nhất không còn blocker hay major chưa xử lý.
- Giữ khuôn 7 mục và độ sâu như các bài đã kiểm chứng (khoảng 7.000–16.000 ký tự, ví dụ `content/topics/db/db-mvcc.md`).
- Phản biện theo nhóm tối đa 5 bài. Mỗi vòng là một agent mới, mô hình Opus. Báo cáo lưu ở `docs/reviews/chang-NN.md`.
- Không thêm, bớt hay dời chủ đề và chặng. Được sửa câu chữ `title`, `summary`, `goal`, `practice` khi nguồn cho thấy sai hoặc khi mâu thuẫn với quyết định của Lam, và ghi mỗi chỗ sửa vào báo cáo chặng.
- Không viết lại 15 bài đã kiểm chứng. Ngoại lệ: 4 góp ý ở Task 3, và mục "Đào sâu" cho chủ đề lặp lại.
- Claude không tạo tài khoản hay đăng nhập Azure, SerpApi hay cổng thanh toán. Trước khi Lam quyết ở chặng 25, không có lab gọi LLM.
- Không dừng hay sửa dịch vụ Windows `postgresql-x64-17` (đang giữ cổng 5432). Lab chạy ở cổng 5433.
- Không commit khóa API hay mật khẩu thật. `lab`/`lab_app` của môi trường lab là ngoại lệ đã có.
- Release theo `CLAUDE.md`. Lam đã cho phép publish và push `main` sau mỗi chặng mà không hỏi lại. Bước nào lỗi thì dừng và báo Lam.
- Không ghi vào `data/users/me`; chỉ đọc để kiểm tra sau release.
- Lam chưa làm app thực hành nên chưa có `practice-measurement`. Bài có thể nhắc bài thực hành của chặng như việc cần làm, nhưng không dùng nó làm ví dụ hay đưa số liệu về nó.
- `$SCRATCH` trong các lệnh là thư mục scratchpad của phiên đang chạy.

## Review Focus

1. **Lab chạy nhầm vào PostgreSQL 17 của Lam ở cổng 5432**, vì thiếu biến môi trường hay mặc định cũ. Lab phải luôn tới container PostgreSQL 16. Task 2 bước 4 kiểm dòng `Máy chủ: PostgreSQL 16`. Mọi lab mới chạy qua `lab/lib/harness.mjs`, và README ghi dòng `Máy chủ:` của lần chạy.
2. **Câu có `[^id]` nhưng nguồn không nói điều đó**, hoặc `supports` đúng còn câu trong bài nói mạnh hơn. Prompt phản biện ở Task 1 bắt agent tự mở nguồn bằng WebFetch. Task 5 bước 2 kiểm báo cáo có liệt kê nguồn đã mở.
3. **Số trong bài lệch với `output.txt` hay với nguồn** sau khi sửa theo phản biện. Bước kiểm ở cuối vòng sửa của Task 5 so lại những số đã sửa.
4. **Release làm mất hoặc đổi dữ liệu học.** Task 6 ghi mốc `meta` và số doc `t.*` trước khi publish, rồi so sau khi publish.
5. **Khóa API hay chuỗi bí mật lọt vào repo công khai**, nhất là ở bài `learn-practice-case`, các bài SerpApi, Azure, và lab về sau. Task 6 bước 1 quét diff trước khi push.

---

### Task 1: Checklist và quy trình kiểm chứng trong repo

**Files:**
- Create: `docs/kiem-chung.md`
- Modify: `CLAUDE.md` (câu "checklist kiểm chứng (mục 6 của plan)" trong mục "Quy tắc nội dung")

**Interfaces:**
- Produces: `docs/kiem-chung.md` với bốn phần có tiêu đề cố định. Các task sau trỏ tới chúng:
  - `## Checklist`: mục A–F, 21 điểm;
  - `## Mức độ`;
  - `## Quy trình một chặng`;
  - `## Phản biện`: prompt và mẫu báo cáo.

- [ ] **Bước 1: Vào nhánh**

```bash
git switch bai-hoc/chang-01
```

Nhánh này được tạo khi commit spec và kế hoạch, cắt từ `main`.

- [ ] **Bước 2: Viết `docs/kiem-chung.md`**

Bốn phần như sau:

**`## Checklist`**: chép nguyên văn mục 6 của spec (A. Cấu trúc … F. Metadata, 21 điểm).

**`## Mức độ`**: chép nguyên văn định nghĩa blocker, major, minor ở mục 5.5 của spec. Thêm hai câu:
- "Nguồn không mở được thì nhận định dựa vào nó tính là major."
- "Bài qua 3 vòng vẫn còn blocker hoặc major thì để ở `draft` và báo Lam."

**`## Quy trình một chặng`**: mục 5.2–5.8 của spec viết thành các bước đánh số. Thêm hai lệnh:

Lệnh liệt kê chủ đề của chặng:

```bash
node -e 'const y=require("yaml"),fs=require("fs"),p=require("path");const n=+process.argv[1];const w=y.parse(fs.readFileSync("content/roadmap.yaml","utf8")).weeks.find(x=>x.week===n);console.log(w.title+"\nMục tiêu: "+w.goal+"\nThực hành: "+w.practice);for(const id of w.topics){const f=require("child_process").execSync("git ls-files content/topics").toString().split("\n").find(x=>p.basename(x)===id+".md");const t=fs.readFileSync(f,"utf8");console.log(id,(t.match(/^contentStatus: (.+)$/m)||[])[1],f)}' <N>
```

Lệnh kiểm nội dung: `npm run validate`. Khi đạt, dòng cuối là `· 0 lỗi`.

**`## Phản biện`** có hai phần.

Prompt cho agent phản biện. Chép đúng văn bản dưới đây, chỉ thay phần trong `<>`:

```text
Bạn là người phản biện độc lập cho bài học trong repo D:\lam.nguyen\Projects\fullstack-mindmap. Bạn không viết các bài này và không biết gì về phiên viết.

Đọc CLAUDE.md (mục "Quy tắc nội dung") và docs/kiem-chung.md (mục Checklist và Mức độ). Sau đó phản biện các bài sau:
<danh sách file bài, kèm thư mục lab/experiments/<id>/ nếu có>

Các bài khác trong cùng chặng, để kiểm tra trùng lặp và mâu thuẫn: <danh sách file>

Với mỗi bài:
1. Tự mở bằng WebFetch từng nguồn trong `sources` mà bài trích. So từng câu có [^id] với chính nội dung nguồn. Không tin trường `supports`.
2. So mọi con số, tên, ngày, thông báo lỗi trong bài với nguồn hoặc với lab/experiments/<id>/output.txt.
3. Đi qua từng điểm A–F của checklist.
4. Chạy `npm run validate` và ghi lỗi hay cảnh báo liên quan tới bài.

Không sửa file nào. Trả về đúng mẫu sau, bằng tiếng Việt:

## Vòng <M> — <ngày> — nhóm <tên nhóm>
Bài: <danh sách id>
Nguồn đã mở: <id nguồn: mở được / không mở được>
| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
Tổng: <x> blocker, <y> major, <z> minor.

Không có phát hiện thì ghi một dòng "Không có phát hiện" thay cho bảng.
```

Mẫu `docs/reviews/chang-NN.md`. Mỗi vòng ghi thêm vào cuối file:
- báo cáo nguyên văn của agent;
- phần `### Xử lý` do Claude viết: mỗi phát hiện một dòng, gồm "đã sửa: …", "giữ nguyên: lý do…" (chỉ cho minor) hoặc "không đồng ý: lý do…";
- dòng `Kết luận vòng: sạch` hoặc `Kết luận vòng: cần vòng sau`.

- [ ] **Bước 3: Sửa `CLAUDE.md`**

Thay "checklist kiểm chứng (mục 6 của plan)" bằng "checklist kiểm chứng trong `docs/kiem-chung.md`". Thêm một câu ngay sau đó: "Quy trình viết, phản biện và release từng chặng cũng nằm ở đó."

- [ ] **Bước 4: Kiểm tra**

```bash
grep -c "mục 6 của plan" CLAUDE.md
grep -c "^## " docs/kiem-chung.md
```

Sau đó chạy lệnh liệt kê chủ đề ở bước 2 với tham số `1`.

Expected:
- lệnh 1 in `0`;
- lệnh 2 in ít nhất `4`;
- lệnh liệt kê in đủ 11 chủ đề của chặng 1: 4 khung, 7 đã kiểm chứng.

- [ ] **Bước 5: Commit**

```bash
git add docs/kiem-chung.md CLAUDE.md
git commit -m "docs: checklist và quy trình kiểm chứng theo chặng"
```

### Task 2: Lab chạy cạnh PostgreSQL 17 của Lam

**Files:**
- Modify: `lab/docker-compose.yml` (dòng `ports` của service `postgres`)
- Modify: `lab/lib/harness.mjs` (giá trị mặc định của `port` và câu chú thích dòng 2)
- Modify: `lab/README.md` (đoạn "Kết nối mặc định")

**Interfaces:**
- Produces:
  - container PostgreSQL 16 của lab ở `localhost:5433`, đổi được bằng biến `LAB_PG_PORT`;
  - `config.port` trong `harness.mjs` mặc định `5433`, vẫn đổi được bằng `PGPORT`.

- [ ] **Bước 1: Thấy lỗi**

```bash
cd lab && docker compose up -d postgres
```

Expected: lỗi bind cổng 5432 (`port is already allocated` hoặc `bind: ... address already in use`). Không chạy lab nào ở bước này: cổng 5432 là PostgreSQL 17 của Lam.

- [ ] **Bước 2: Sửa ba file**

- `docker-compose.yml`: `ports: ["127.0.0.1:${LAB_PG_PORT:-5433}:5432"]` (Oracle cũng `127.0.0.1:1521:1521`). Ghi chú: cổng 5432 trên máy Lam đã có PostgreSQL 17; chỉ mở trên 127.0.0.1 vì mật khẩu lab yếu.
- `harness.mjs`: `port: Number(process.env.PGPORT ?? 5433)`.
- `lab/README.md`: thay `localhost:5432` bằng `localhost:5433`. Thêm câu: lab cố ý không dùng 5432 để không chạy nhầm vào PostgreSQL có sẵn trên máy.

- [ ] **Bước 3: Dựng container và cài phụ thuộc**

```bash
cd lab && docker compose up -d postgres && npm ci
```

Expected: container `postgres` ở trạng thái running. `docker compose ps` cho thấy `127.0.0.1:5433->5432/tcp`.

- [ ] **Bước 4: Chạy thử lab cũ, không ghi đè kết quả đã lưu**

```bash
cd lab && node experiments/db-mvcc/run.mjs > "$SCRATCH/db-mvcc-check.txt" 2>&1; grep "Máy chủ:" "$SCRATCH/db-mvcc-check.txt"; grep -c "are dead but not yet removable" "$SCRATCH/db-mvcc-check.txt"; git status --short experiments
```

`$SCRATCH` là thư mục scratchpad của phiên.

Expected:
- dòng `Máy chủ: PostgreSQL 16.x …`;
- đếm `are dead but not yet removable` ≥ `2` (hai trường hợp giữ dead tuple, khớp kết luận trong README);
- `git status` không có thay đổi trong `experiments/`.

Đợi container nhận kết nối nếu lần đầu chạy báo `ECONNREFUSED`.

- [ ] **Bước 5: Commit**

```bash
git add lab/docker-compose.yml lab/lib/harness.mjs lab/README.md
git commit -m "lab: PostgreSQL 16 của lab chạy ở cổng 5433, không đụng PostgreSQL có sẵn trên máy"
```

### Task 3: Bốn góp ý câu chữ còn treo

**Files:**
- Modify:
  - `content/topics/db/db-normalization.md` (dòng 76 và dòng `changelog` ngày 2026-10-29);
  - `content/topics/db/db-schema-data-model.md` (dòng 137 và dòng `changelog` ngày 2026-10-29);
  - `content/topics/db/db-transaction-acid.md` (dòng 81).

**Interfaces:**
- Produces: 3 bài đã sửa, vẫn `verified`, giữ nguyên `verifiedAt`. Task 5 phản biện chúng thành nhóm B.

- [ ] **Bước 1: Sửa theo spec mục 5.1 bước 3**

- `db-normalization.md:76`: đổi thành "Áp quy tắc này vào bảng yêu cầu của lab".
- `db-schema-data-model.md:137`: thêm "theo nghĩa bài dùng" để "schema" không bị hiểu là namespace `exp_hr`/`exp_it`.
- `db-transaction-acid.md:81`: nói rõ lab tái hiện cả trạng thái nửa vời, không chỉ thao tác nhiều lệnh. Đọc `lab/experiments/db-transaction-acid/output.txt` trước, để câu chỉ nói điều output cho thấy.
- Viết lại hai dòng `changelog` ngày 2026-10-29 của `db-normalization` và `db-schema-data-model` cho sát với thay đổi đã làm hôm đó. Xem `git show 909c40f dd8cfd1 -- <file>`.
- Thêm một dòng `changelog` ngày sửa cho mỗi bài: "Sửa câu chữ theo góp ý minor của vòng phản biện 29/10."

- [ ] **Bước 2: Kiểm tra**

Run: `npm run validate`
Expected: `176 chủ đề (skeleton: 156, verified: 15, draft: 5) · 0 lỗi`

- [ ] **Bước 3: Commit**

```bash
git add content/topics/db/db-normalization.md content/topics/db/db-schema-data-model.md content/topics/db/db-transaction-acid.md
git commit -m "content: sửa 4 góp ý câu chữ còn treo ở 3 bài đã kiểm chứng"
```

### Task 4: Soạn 4 bài chặng 1

**Files:**
- Modify:
  - `content/topics/learn/learn-six-questions.md`;
  - `content/topics/learn/learn-using-mindmap.md`;
  - `content/topics/learn/learn-practice-case.md`;
  - `content/topics/learn/learn-lab.md`.

**Interfaces:**
- Consumes: `docs/kiem-chung.md` (`## Quy trình một chặng`, các bước viết bài và lab) từ Task 1.
- Produces: 4 bài ở `draft`, đủ 7 mục, cho Task 5.

- [ ] **Bước 1: Viết từng bài theo quy trình viết bài.** Nguồn gợi ý theo spec mục 7.1:
  - `learn-six-questions`: nghiên cứu gốc về học bằng cách tự trả lời câu hỏi (retrieval practice) và tự giải thích, bản toàn văn mở được. Sáu câu hỏi khớp đúng `summary`: vấn đề, cơ chế, đánh đổi, khi nào không dùng, lỗi thường gặp, cách kiểm chứng. Nối chúng với 7 mục của khuôn bài.
  - `learn-using-mindmap`: `README.md` và `CLAUDE.md` trên GitHub (`https://github.com/nhatlam1111/fullstack-mindmap/blob/main/...`), và hành vi app hiện tại trong `src/`:
    - ba trạng thái nội dung;
    - trạng thái học, tiêu chí "Đã hiểu" (3 ô: tự trả lời, thử nghiệm, ghi chú bằng lời mình), lịch ôn 7 → 21 → 60 → 150 ngày;
    - chọn chặng.
    Hành vi lấy từ code thì ghi phiên bản app (`package.json` 0.1.0, ngày release).
  - `learn-practice-case`:
    - đề bài 30 chặng trong `content/roadmap.yaml`;
    - tài liệu SerpApi về Google Play API và gói Free;
    - tài liệu Microsoft về hạn mức miễn phí của Azure Container Apps.
    Đổi `volatility` sang `fast` vì bài dựa vào hạn mức có thể đổi, và ghi việc này vào báo cáo chặng. Không gọi SerpApi, không đưa khóa vào bài.
  - `learn-lab`:
    - `lab/README.md`, `lab/docker-compose.yml`;
    - tài liệu Docker Compose;
    - một lab có thật làm ví dụ `lab-run`, ví dụ `path: lab/experiments/db-mvcc`.

- [ ] **Bước 2: Tự đối chiếu checklist từng bài, rồi kiểm tra**

Run: `npm run validate`
Expected: `176 chủ đề (skeleton: 152, verified: 15, draft: 9) · 0 lỗi`

- [ ] **Bước 3: Commit**

```bash
git add content/topics/learn
git commit -m "content: soạn 4 bài chặng 1 (cách học, cách dùng mindmap, bài thực hành, lab)"
```

### Task 5: Phản biện và kiểm chứng chặng 1

**Files:**
- Create: `docs/reviews/chang-01.md`
- Modify: 4 bài `learn-*`, cùng 3 bài ở Task 3 nếu phản biện yêu cầu.

**Interfaces:**
- Consumes:
  - prompt và mẫu báo cáo ở `docs/kiem-chung.md` `## Phản biện`;
  - bài từ Task 3 và Task 4.
- Produces:
  - 4 bài `learn-*` ở `verified`;
  - `docs/reviews/chang-01.md`, có vòng cuối "sạch" cho cả hai nhóm.

- [ ] **Bước 1: Giao phản biện vòng 1**

Hai agent mới, chạy song song, model Opus, mỗi agent một prompt của `docs/kiem-chung.md`:
- **Nhóm A:** 4 bài `learn-*`. Danh sách "bài khác trong chặng" là 7 bài đã kiểm chứng của chặng 1.
- **Nhóm B:** 3 bài của Task 3. Agent chỉ phản biện những đoạn đã đổi, xem `git diff main -- <file>`, cùng sự khớp của chúng với lab.

- [ ] **Bước 2: Ghi báo cáo**

Chép nguyên văn báo cáo vào `docs/reviews/chang-01.md`.

Kiểm: mỗi báo cáo có dòng `Nguồn đã mở:` và liệt kê nguồn. Thiếu thì giao lại cho một agent mới. Nguồn "không mở được" thì nhận định dựa vào nó tính là major.

- [ ] **Bước 3: Xử lý và lặp vòng**

1. Sửa mọi blocker và major. Viết phần `### Xử lý`.
2. Với mỗi số hay câu trích đã sửa, mở lại nguồn hoặc `output.txt` để so.
3. Ghi `changelog` "Phản biện vòng M: …".
4. Giao vòng sau cho agent mới, chỉ gồm các bài có sửa.
5. Lặp đến khi vòng gần nhất "sạch", tối đa 3 vòng mỗi bài. Quá 3 vòng thì để bài ở `draft` theo `## Mức độ`.

- [ ] **Bước 4: Đặt kiểm chứng**

Bài sạch thì đặt `contentStatus: verified`, `verifiedBy: claude` và `verifiedAt` là ngày vòng sạch. Ba bài nhóm B giữ `verifiedAt` cũ, vì chỉ các đoạn đã đổi được phản biện (xem "Quy tắc vòng phản biện" trong `docs/kiem-chung.md`).

Run: `npm run validate`
Expected: `· 0 lỗi`, và `verified: 19` nếu cả 4 bài qua.

- [ ] **Bước 5: Commit**

```bash
git add docs/reviews/chang-01.md content/topics
git commit -m "review: chặng 1 — <x> vòng, vòng cuối 0 blocker 0 major; kiểm chứng 4 bài"
```

### Task 6: Release chặng 1 (quy trình release dùng cho mọi chặng)

**Files:**
- Modify: `releases.md` (thêm một dòng đầu bảng)
- Modify: `releases/last-good/artifact.html`, `releases/last-good/release.json`, `releases/last-good/ids.lock`

**Interfaces:**
- Consumes: nhánh `bai-hoc/chang-NN` đã có nội dung kiểm chứng.
- Produces:
  - `main` đã push và Pages đã deploy;
  - artifact `https://claude.ai/artifact/4TNPENW2kRQLTwQ38LPK7Y` mang bản mới;
  - `D:\lam.nguyen\Projects\MindMap` khớp md5 với các file được git theo dõi.

Các bước dưới đây là quy trình release cho mọi chặng NN.

- [ ] **Bước 1: Build và quét bí mật**

```bash
npm ci && (cd lab && npm ci) && npm run release
git diff main -U0 | grep -E "^\+" | grep -iE "(api[_-]?key|secret|token|password)\s*[:=]\s*['\"]?[A-Za-z0-9_./+-]{12,}|\b[a-f0-9]{64}\b|AccountKey=|SharedAccessSignature|[?&]sig=|ghp_|github_pat_|sk-ant-|-----BEGIN"
```

Expected:
- `npm run release` qua đủ 7 bước, có `dist/artifact.html` và `dist/release.json`;
- lệnh quét không in dòng nào, hoặc mỗi dòng in ra chỉ là chỗ giữ chỗ trong tài liệu (ví dụ `YOUR_API_KEY`) hay giá trị không phải bí mật đã kiểm bằng mắt. Có dòng khác thì dừng. Mẫu bắt giá trị thật sau `[:=]` (từ 12 ký tự), chuỗi hex 64 ký tự (dạng key SerpApi), khóa Azure Storage, SAS, token GitHub, key Anthropic và khóa PEM.

Lỗi thì dừng và báo Lam, không publish.

- [ ] **Bước 2: Ghi mốc dữ liệu học**

Đọc `data/users/me` bằng ArtifactData. Nếu là phiên mới, trước đó `Artifact` `read` URL artifact. Ghi lại:
- `updatedAt` và `lastTopicId` của doc `meta`;
- số doc có id bắt đầu bằng `t.`.

Lần đo gần nhất (29/10): 10 doc `t.*`, `lastTopicId: db-sql-nosql-terms`.

- [ ] **Bước 3: Publish**

`Artifact` publish `file_path: dist/artifact.html`, `url: https://claude.ai/artifact/4TNPENW2kRQLTwQ38LPK7Y`, không truyền `capabilities`.

- [ ] **Bước 4: Kiểm dữ liệu học sau publish**

Đọc lại `data/users/me`.

Expected: `meta.updatedAt`, `lastTopicId` và số doc `t.*` đúng như bước 2. Nếu Lam vừa học thì số có thể tăng, nhưng không được giảm.

Lệch thì dừng và báo Lam. `releases/last-good/` vẫn giữ bản trước để quay lại.

- [ ] **Bước 5: Ghi release**

1. Thêm dòng đầu bảng `releases.md`: `| DD/MM/YYYY | Chặng NN: <các bài đã kiểm chứng, lab mới, ghi chú> | K / N / V |`. K/N/V lấy từ `dist/release.json` (`topics`).
2. Chép `content/ids.lock`, `dist/artifact.html`, `dist/release.json` vào `releases/last-good/`.

```bash
git add releases.md releases/last-good
git commit -m "release: DD/MM/YYYY — chặng NN, K/N/V"
```

- [ ] **Bước 6: Push `main` và chờ Pages**

```bash
git switch main && git merge --ff-only bai-hoc/chang-NN && git push origin main
gh run list --workflow pages.yml --limit 1
```

Theo dõi lần chạy đó bằng `gh run watch <id> --exit-status`, chạy nền.

Expected: lần chạy của commit vừa push kết thúc `completed success`.

- [ ] **Bước 7: Chép source về `MindMap` và so md5**

```bash
f=.sync/source-$(date +%Y%m%d%H%M%S).tar.gz
git ls-files -z | tar --null -T - -czf "$f"
tar -xzf "$f" -C /d/lam.nguyen/Projects/MindMap --overwrite --no-same-owner --no-same-permissions
git ls-files -z | xargs -0 md5sum > "$SCRATCH/a.md5"
(cd /d/lam.nguyen/Projects/MindMap && md5sum -c --quiet "$SCRATCH/a.md5")
```

Expected: lệnh cuối không in dòng nào, exit 0.

- [ ] **Bước 8: Dọn và báo Lam**

`git branch -d bai-hoc/chang-NN`. Rồi gửi Lam báo cáo theo spec mục 5.8:
- các bài đã lên `verified`;
- các bài còn ở `draft` và lý do;
- lab mới;
- minor để lại;
- các chỗ sửa câu chữ `title`, `summary`, đề bài;
- link artifact và link Pages.

### Task 7: Chặng 3 — kiểm chứng 5 bài nháp

Chặng 2 đã kiểm chứng xong (4/4 bài), nên không có task.

**Interfaces:**
- Consumes: `docs/kiem-chung.md` (Task 1), lab cổng 5433 (Task 2), quy trình release (Task 6).
- Produces: 5 bài chặng 3 ở `verified`, `docs/reviews/chang-03.md`, bản release.

- [ ] **Bước 1:** `git switch main && git pull --ff-only && git switch -c bai-hoc/chang-03`
- [ ] **Bước 2:** Tự đối chiếu checklist cho `db-index-basics`, `db-query-plan`, `db-btree`, `db-lsm-tree`, `db-access-patterns`. Sửa trước khi phản biện. Không viết lại bài.
- [ ] **Bước 3:** Một nhóm phản biện gồm cả 5 bài, theo các bước 1–5 của Task 5. Lab ngày 16/10 giữ nguyên. Chỉ chạy lại khi phản biện nghi ngờ kết quả hoặc khi sửa thử nghiệm. Chạy lại thì thay cả `output.txt`, README và số trong bài.
- [ ] **Bước 4:** Release theo Task 6.

### Task 8–34: Chặng 4–30

Task `N + 4` làm chặng `N`: Task 8 là chặng 4, …, Task 34 là chặng 30. Mỗi task gồm:

- [ ] **Bước 1:** `git switch main && git pull --ff-only && git switch -c bai-hoc/chang-NN`. Liệt kê chủ đề bằng lệnh ở `docs/kiem-chung.md`.
- [ ] **Bước 2:** Với mỗi chủ đề chưa `verified`, viết bài và lab theo `## Quy trình một chặng`. Tự đối chiếu checklist. `npm run validate` phải `· 0 lỗi`. Commit `content: soạn <n> bài chặng NN`.
- [ ] **Bước 3:** Chia nhóm tối đa 5 bài, giữ các bài liên quan cùng nhóm. Phản biện, xử lý, lặp vòng và đặt kiểm chứng theo các bước 1–5 của Task 5. Báo cáo lưu ở `docs/reviews/chang-NN.md`.
- [ ] **Bước 4:** Release theo Task 6.

Ghi chú riêng từng chặng. Chặng không có trong bảng thì không có ghi chú riêng.

| Chặng | Ghi chú |
|---|---|
| 4 | 6 bài khung. Ba bài `aidev-*` không có lab gọi LLM: ví dụ lấy từ tài liệu chính thức của công cụ coding agent, ghi tên và phiên bản. `db-drivers`, `db-orm`, `db-timeouts` có lab PostgreSQL. ORM chọn một thư viện TypeScript phổ biến, cố định phiên bản trong `lab/package.json`. |
| 5 | Thêm service `redis` và `mongo` vào `lab/docker-compose.yml`, cố định phiên bản, cổng không trùng dịch vụ đang chạy trên máy (kiểm bằng `netstat -ano`). Xóa ghi chú "Chặng 5 thêm redis và mongo". |
| 6 | `db-vector-search` dùng lab pgvector: thêm service riêng dùng image `pgvector/pgvector` bản PostgreSQL 16, cổng khác 5432 và 5433. Không gọi model nào để tạo embedding: dùng vector tự tạo trong lab và ghi rõ giới hạn. |
| 12 | `learn-weekly-schedule`: sửa `title` và `summary` theo spec mục 7.8. Hỏi Lam con số "6–8 giờ" trong báo cáo chặng; Lam chưa xác nhận thì bỏ. `learn-spaced-review` viết ở đây; chặng 30 chỉ xét mục "Đào sâu". |
| 15 | `be-idempotency` viết ở đây; chặng 24 chỉ xét mục "Đào sâu". |
| 19–20 | Không có lab Azure. Ví dụ từ tài liệu Microsoft, ghi tên dịch vụ và ngày đọc. Giá và hạn mức ghi kèm ngày. |
| 24 | Không dùng tài khoản cổng thanh toán. Lab chỉ mô phỏng cơ chế chạy được trên máy (idempotency key, ledger trên PostgreSQL). Xét "Đào sâu" cho `be-idempotency`. |
| 25 | **Trước bước 1:** hỏi Lam cách làm lab cho các bài AI theo spec mục 7.5, rồi ghi quyết định vào spec. Nếu dùng API key: Lam tự đặt key vào `lab/.env`, thêm `lab/.env` vào `.gitignore` trước khi chạy, không in key ra output. |
| 26 | Xét "Đào sâu" cho `db-vector-search`. |
| 28 | Xét "Đào sâu" cho `aidev-writing-specs`, `aidev-repo-context`, `aidev-reviewing-ai-code`. |
| 29 | Xét "Đào sâu" cho `aidev-tests-as-guardrails`. |
| 30 | Xét "Đào sâu" cho `learn-spaced-review`. Sau release, chạy `npm run report` và báo Lam các link chết hay bài quá hạn rà soát. |

"Xét Đào sâu" theo spec mục 7.4. Nếu `goal` của chặng đòi hỏi nhiều hơn bài đang có, thêm mục `## Đào sâu` cuối bài và đưa bài vào một nhóm phản biện của chặng. Phản biện chỉ xét mục mới. Nếu không, ghi "không cần Đào sâu" vào báo cáo chặng.
