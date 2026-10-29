# Kiểm chứng bài học

Tiêu chuẩn và quy trình Claude dùng để viết, phản biện và đưa bài lên `verified` (`verifiedBy: claude`), theo quy tắc nội dung trong `CLAUDE.md`. Dựng lại ngày 29/10/2026 từ `CLAUDE.md`, validator và cách 15 bài đầu được kiểm chứng; bản gốc "mục 6 của plan" không còn. Thiết kế: `docs/superpowers/specs/2026-10-29-hoan-thien-bai-hoc-design.md`.

## Checklist

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

## Mức độ

- **blocker**: sai sự thật, bịa ví dụ, số không khớp nguồn hay output, vi phạm quy tắc `CLAUDE.md`.
- **major**: thiếu nguồn cho nhận định quan trọng, thiếu phiên bản, cơ chế mô tả sai một phần, câu hỏi tự kiểm tra không trả lời được từ bài, mâu thuẫn với bài khác.
- **minor**: câu chữ, cách trình bày.

Nguồn không mở được thì nhận định dựa vào nó tính là major.

Bài qua 3 vòng vẫn còn blocker hoặc major thì để ở `draft` và báo Lam.

**Quy tắc vòng phản biện** (rút ra từ chặng 1, ngày 29/10/2026):

- Một vòng **sạch** nghĩa là 0 blocker và 0 major. Minor không làm vòng mất sạch.
- Sửa chữ trong bài sau một vòng (kể cả sửa minor) thì phải có vòng sau cho phần đã sửa. Riêng các dòng metadata (`contentStatus`, `verifiedAt`, `verifiedBy`, một dòng `changelog` ghi kết quả vòng) không cần vòng mới.
- Vòng 3 là vòng cuối. Sau vòng 3 không viết câu mới. Nếu vòng 3 còn blocker hoặc major, chỉ được xử lý bằng cách xóa phần bị góp ý để đoạn đó trở về đúng câu chữ đã qua một vòng trước mà không có blocker hay major; không làm được như vậy thì bài ở lại `draft`.
- Bài đã `verified` mà lần này chỉ các đoạn đã đổi được phản biện thì giữ `verifiedAt` cũ. Chỉ đặt `verifiedAt` mới khi cả bài được phản biện.
- Minor để lại được ghi trong `docs/reviews/chang-NN.md`. Ở chặng kế tiếp, các minor để lại của chặng trước được sửa và phản biện thành một nhóm riêng ("nhóm tồn").

## Quy trình một chặng

1. **Mở nhánh và xem chặng.** Từ `main` mới nhất, tạo nhánh `bai-hoc/chang-NN`. Liệt kê chủ đề, trạng thái, mục tiêu và bài thực hành của chặng:

   ```bash
   node -e 'const y=require("yaml"),fs=require("fs"),p=require("path");const n=+process.argv[1];const w=y.parse(fs.readFileSync("content/roadmap.yaml","utf8")).weeks.find(x=>x.week===n);console.log(w.title+"\nMục tiêu: "+w.goal+"\nThực hành: "+w.practice);for(const id of w.topics){const f=require("child_process").execSync("git ls-files content/topics").toString().split("\n").find(x=>p.basename(x)===id+".md");const t=fs.readFileSync(f,"utf8");console.log(id,(t.match(/^contentStatus: (.+)$/m)||[])[1],f)}' <N>
   ```

2. **Nhận việc tồn.** Đọc `docs/reviews/` của chặng trước. Các minor để lại thành một nhóm phản biện riêng ở bước 8 của chặng này.
3. **Đọc trước khi viết.** Với mỗi chủ đề chưa `verified`: đọc frontmatter khung (summary, prerequisites, related), `goal` và `practice` của chặng, và các bài đã kiểm chứng liên quan, để không viết trùng và không mâu thuẫn.
4. **Tìm và đọc nguồn.** Mở đọc toàn văn bằng WebFetch. Ưu tiên tài liệu chính thức đúng phiên bản, rồi đặc tả (RFC, W3C, ECMA), case công khai do chính tổ chức công bố, nghiên cứu gốc. `supports` tóm đúng điều nguồn nói, bằng lời của Claude; `checkedAt` là ngày đọc.
5. **Viết bài.** Đủ 7 mục, theo giọng và độ sâu của các bài đã kiểm chứng (ví dụ `content/topics/db/db-mvcc.md`). "Câu hỏi tự kiểm tra" là câu hỏi vận dụng. Thêm `changelog` "Claude soạn bài…", đổi `contentStatus` sang `draft`.
6. **Lab.** Chủ đề có hành vi chạy thử được trên máy (database, HTTP, runtime JavaScript, TypeScript, Git, container, thư viện Node) có lab trong `lab/experiments/<id>/` theo `lab/README.md`: `run.mjs`, `output.txt` nguyên văn, `README.md` có câu hỏi, môi trường, lệnh chạy lại, kết luận chỉ từ output và giới hạn. Lab PostgreSQL dùng `lab/lib/harness.mjs` (cổng 5433). Thêm service hay package thì cố định phiên bản. Chủ đề không chạy thử được dùng tài liệu chính thức hoặc case công khai; không có thì ghi "Chưa có ví dụ thực tế". Chưa có lab gọi LLM cho tới khi Lam quyết ở chặng 25.
7. **Tự đối chiếu.** Đi qua mục Checklist cho từng bài. `npm run validate` phải kết thúc bằng `· 0 lỗi`. Commit.
8. **Phản biện theo nhóm.** Chia bài thành nhóm tối đa 5, giữ bài liên quan cùng nhóm. Mỗi nhóm giao một agent mới (Opus) với prompt ở mục Phản biện. Chép báo cáo nguyên văn vào `docs/reviews/chang-NN.md`, viết phần Xử lý.
9. **Sửa và lặp.** Sửa mọi blocker và major; mở lại nguồn hoặc `output.txt` để so mỗi số hay câu trích đã sửa. Thêm `changelog` "Phản biện vòng M: …". Giao vòng sau cho agent mới, chỉ gồm bài có sửa (phạm vi có thể giới hạn ở `git diff` của phần đã sửa). Lặp theo "Quy tắc vòng phản biện" ở mục Mức độ: tối đa 3 vòng mỗi bài, sau vòng 3 không viết câu mới. Minor sửa nếu nhanh (rồi cần vòng sau), nếu không thì ghi "giữ nguyên" kèm lý do.
10. **Đặt kiểm chứng.** Bài có vòng gần nhất sạch và không còn chữ nào chưa qua phản biện: `contentStatus: verified`, `verifiedBy: claude`, `verifiedAt` là ngày vòng sạch (bài đã kiểm chứng mà chỉ phản biện phần đã đổi thì giữ `verifiedAt` cũ). Thêm một dòng `changelog` ghi kết quả vòng cuối. Commit.
11. **Release** theo Task 6 của `docs/superpowers/plans/2026-10-29-hoan-thien-bai-hoc.md` khi làm trên máy Lam (build từ bản clone này, không cần bước đóng gói và môi trường build ở `CLAUDE.md`); các bước publish, kiểm dữ liệu học, ghi `releases.md`, `releases/last-good/` và chép về `MindMap` là của `CLAUDE.md`. Lam đã cho phép publish và push `main` sau mỗi chặng mà không hỏi lại; bước nào lỗi thì dừng và báo Lam.
12. **Báo Lam.** Bài đã lên `verified`; bài còn `draft` và lý do; lab mới; minor để lại; các chỗ sửa câu chữ `title`, `summary`, `goal`, `practice`; link artifact và Pages.

Chỉ sửa câu chữ `title`, `summary`, `goal`, `practice` khi nguồn cho thấy câu đó sai hoặc khi nó mâu thuẫn với quyết định của Lam; không thêm, bớt, dời chủ đề hay chặng; không đổi id. Chủ đề có mặt ở chặng sau chỉ được xét thêm mục "Đào sâu" khi `goal` của chặng đó đòi hỏi nhiều hơn bài đang có.

## Phản biện

**Prompt cho agent phản biện.** Chép đúng, chỉ thay phần trong `<>`:

```text
Bạn là người phản biện độc lập cho bài học trong repo D:\lam.nguyen\Projects\fullstack-mindmap. Bạn không viết các bài này và không biết gì về phiên viết.

Đọc CLAUDE.md (mục "Quy tắc nội dung") và docs/kiem-chung.md (mục Checklist và Mức độ). Sau đó phản biện các bài sau:
<danh sách file bài, kèm thư mục lab/experiments/<id>/ nếu có>

Các bài khác trong cùng chặng, để kiểm tra trùng lặp và mâu thuẫn: <danh sách file>

Ghi chú bối cảnh:
- <số vòng, nơi có báo cáo vòng trước, và phạm vi nếu vòng này chỉ xét phần đã đổi (kèm lệnh git diff); bỏ dòng này nếu là vòng 1 phản biện toàn bài>
- Nguồn có url dạng https://github.com/nhatlam1111/fullstack-mindmap/blob/main/<đường dẫn> là file của chính repo này. Nhánh đang làm có thể chưa được push, nên hãy đọc file <đường dẫn> ở HEAD trong thư mục làm việc thay cho bản trên GitHub.
- Với nguồn PDF, WebFetch có thể lưu file nhị phân; trích text bằng `pdftotext -layout <file> <out.txt>` (có sẵn trong Git Bash) rồi đọc.

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

**Báo cáo `docs/reviews/chang-NN.md`.** Mỗi chặng một file. Mỗi vòng ghi thêm vào cuối file:

- báo cáo nguyên văn của agent;
- phần `### Xử lý` do Claude viết: mỗi phát hiện một dòng, gồm "đã sửa: …", "giữ nguyên: lý do…" (chỉ cho minor) hoặc "không đồng ý: lý do…";
- dòng `Kết luận vòng: sạch` hoặc `Kết luận vòng: cần vòng sau`.
