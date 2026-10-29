# Phản biện chặng 1

Nhóm A: 4 bài mới (`learn-six-questions`, `learn-using-mindmap`, `learn-practice-case`, `learn-lab`).
Nhóm B: đoạn đã đổi ở 3 bài đã kiểm chứng (`db-normalization`, `db-schema-data-model`, `db-transaction-acid`), theo 4 góp ý còn treo từ vòng phản biện ngày 29/10.

Mỗi vòng do một agent mới (Opus) thực hiện theo prompt ở `docs/kiem-chung.md`.

## Vòng 1 — 29/10/2026 — nhóm B
Bài: db-normalization, db-schema-data-model, db-transaction-acid

Nguồn đã mở: ms-normalization: mở được (trang có nhãn `is_archived: true`, canonical đã chuyển sang `/previous-versions/...`, và bản tải về không có dòng "Applies to"; điều này chỉ ảnh hưởng tới các đoạn không đổi, nên để cho đợt rà soát hằng tuần); pg-schemas: mở được; pg-tx-tutorial: mở được

Đã đối chiếu (không có lỗi):
- **db-normalization:** Microsoft viết nguyên văn câu "Adv-Room (the advisor's office number) is functionally dependent on the Advisor attribute" và quy tắc "Eliminate fields that don't depend on the key". Thiết kế đã tách khớp `output.txt`: `departments` có `name` unique, `users.department_id references departments`, `requests.requester_email references users`. Thiết kế này cũng khớp câu "hai join" ở dòng 86 và ở db-joins.
- **db-schema-data-model:** gợi ý dùng hai bảng `requests` trả lời được từ lab. Lab cho thấy `exp_hr.requests` có 2 cột, `exp_it.requests` có 3 cột, cả qua câu lệnh tạo bảng lẫn qua `information_schema.columns`.
- **db-transaction-acid:** `output.txt` cho thấy đúng trạng thái nửa vời: `UPDATE 1`, sau đó `23502`, và yêu cầu 1 ở `approved` với 0 dòng lịch sử.
- **Changelog 29/10:** các dòng ngày 2026-10-29 ở cả ba bài mô tả đúng thay đổi của 909c40f, dd8cfd1 và 8e76455.
- **Trùng lặp, mâu thuẫn:** không thấy với các bài còn lại trong chặng.
- **Validate:** `npm run validate` cho kết quả 176 chủ đề, 0 lỗi, 0 cảnh báo.

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| db-normalization | 78 | minor | E19 | "bảng yêu cầu của lab" không rõ là bảng nào, vì lab có hai bảng yêu cầu: `requests_flat` (bảng gộp, có `department_name`) và `requests` (đã tách, không có tên phòng ban). Quy tắc chỉ áp vào bảng gộp. Câu hỏi ở dòng 109 lại đặt tên `requests` cho bảng có dạng của bảng gộp, nên người đọc càng dễ nhầm. | Viết "Áp quy tắc này vào bảng gộp `requests_flat` của lab ở mục Ví dụ: …". |
| db-schema-data-model | 139 | minor | E19 | Thuật ngữ tiếng Anh "namespace" xuất hiện lần đầu ở câu hỏi này mà không được giải thích. Thân bài (dòng 98) và tiêu đề lab đều dùng chữ "không gian tên". Ý câu hỏi thì đúng: PostgreSQL 16 gọi schema là "well-defined namespaces", và `exp_hr` có trong lab. | Đổi thành "không phải schema theo nghĩa không gian tên của PostgreSQL như `exp_hr`", hoặc thêm "(namespace)" vào ô PostgreSQL ở dòng 98. |
| db-transaction-acid | 83 | minor | E19, E18 | Cụm "chạy hai lệnh không có transaction" lệch với chính bài: dòng 100 và 124 nói, theo pg-tx-tutorial, rằng không có `BEGIN` thì mỗi lệnh là một transaction riêng, được bọc `BEGIN`/`COMMIT` ngầm. Lab cũng ghi "mỗi lệnh tự commit". Nội dung vẫn khớp lab, chỉ cách dùng chữ chưa chặt. | Viết "khi hai lệnh chạy ở chế độ tự commit, mỗi lệnh một transaction riêng, không chung một transaction". |

Tổng: 0 blocker, 0 major, 3 minor.

### Xử lý

- db-normalization dòng 78 (minor): đã sửa: viết "bảng gộp `requests_flat` của lab".
- db-schema-data-model dòng 139 (minor): đã sửa: "không phải schema theo nghĩa không gian tên của PostgreSQL như `exp_hr`".
- db-transaction-acid dòng 83 (minor): đã sửa: "khi hai lệnh chạy ở chế độ tự commit, mỗi lệnh là một transaction riêng".

Kết luận vòng: sạch. Vì đã sửa ba câu sau vòng này, ba đoạn đó đi vào vòng 2 của nhóm B.

## Vòng 1 — 29/10/2026 — nhóm A
Bài: learn-six-questions, learn-using-mindmap, learn-practice-case, learn-lab
Nguồn đã mở: roediger-2006: mở được (PDF, trích bằng pdftotext) · dunlosky-2013: mở được (trang tóm tắt; toàn văn cần đăng nhập APS, bài ghi rõ chỉ dùng phần tóm tắt) · mindmap-sections: mở được (scripts/lib/schema.ts, đối chiếu thêm scripts/lib/content.ts) · mindmap-understood, mm-article: mở được (src/components/TopicArticle.tsx) · mm-readme, mm-claude, mm-kiem-chung, mm-content-labels, mm-review-months, mm-model, mm-data, mm-hooks, mm-today: mở được (file trong thư mục làm việc) · ví dụ mvcc-history: mở được (content/topics/db/db-mvcc.md) · mm-roadmap: mở được (content/roadmap.yaml) · mm-practice-design: mở được (docs/superpowers/specs/2026-10-29-lo-trinh-theo-chang-design.md) · serpapi-google-play: mở được · serpapi-pricing: mở được · aca-pricing: mở được (đọc 100.000/103.589 ký tự, phần free grant và idle nằm trong đoạn đã đọc) · google-terms: mở được · lab-readme, lab-compose, lab-harness: mở được (bản chưa commit trong thư mục làm việc) · compose-services: mở được · compose-interpolation: mở được · postgres-image: mở được · lab/experiments/db-mvcc, db-lsm-tree: đã đọc README và output · mở thêm để kiểm một câu: play.google.com/robots.txt: mở được. `npm run validate`: 176 chủ đề, 0 lỗi, 0 cảnh báo; không có lỗi hay cảnh báo nào cho 4 bài này.

| Bài | Vị trí (dòng) | Mức | Điểm checklist | Phát hiện | Đề xuất |
|---|---|---|---|---|---|
| learn-six-questions | 52 | major | B.6, C.11 | Câu "nhớ ít hơn nhóm chỉ đọc một lượt rồi tự viết lại những gì nhớ được" mô tả sai điều kiện STTT. Theo nguồn, nhóm này có một khoảng đọc 5 phút, trong đó đọc trọn đoạn văn trung bình 3,4 lần (Bảng 1), rồi làm ba lần tự nhớ lại. Câu này cũng mâu thuẫn với dòng 95 của chính bài (3,4 lần). | Viết lại: "…nhớ ít hơn nhóm chỉ có một khoảng đọc 5 phút rồi ba lần tự viết lại những gì nhớ được". |
| learn-six-questions | 81–86 | minor | E.19 | "Luồng học một bài" có 4 bước, nhưng dòng 86 viết "Ba bước này khớp với ba tiêu chí". | Sửa thành "Bốn bước này ứng với ba tiêu chí", hoặc ghi rõ bước nào ứng với tiêu chí nào. |
| learn-six-questions | 90 | minor | B.6 | Câu "kể cả khi không có ai chấm hay phản hồi" không đúng: bài nhớ lại có được chấm theo idea unit (40 bài đầu do hai người chấm). Nguồn chỉ nói "without feedback". | Bỏ "không có ai chấm", giữ "không có phản hồi". |
| learn-six-questions | 91 | minor | E.19 | Lặp chữ: "nên nên coi". | Sửa thành "nên coi". |
| learn-six-questions | 67 | minor | B.5, B.7 | Nguồn mindmap-sections (schema.ts) chỉ khai báo danh sách SECTIONS. Việc bắt lỗi nằm ở scripts/lib/content.ts và bỏ qua bài Khung, nên câu "bắt mọi bài" rộng hơn mã. Bài cũng không ghi phiên bản mindmap 0.1.0. | Viết "mọi bài đã có nội dung (Nháp, Đã kiểm chứng)". Thêm content.ts vào nguồn. Ghi "mindmap 0.1.0". |
| learn-using-mindmap | 143 | minor | B.6 | Vế "theo tài khoản, nên đồng bộ giữa các thiết bị" vượt quá README: README chỉ nói "theo tài khoản". Mã (src/views/Today.tsx, LocalNotice) cho thấy khi chưa đăng nhập claude.ai, dữ liệu chỉ lưu trên trình duyệt đó. | Thêm điều kiện "khi đã đăng nhập claude.ai" và dẫn Today.tsx, hoặc bỏ vế "nên đồng bộ". |
| learn-using-mindmap | 133–137, 146 | minor | B.5 | Các nhãn "Nhớ rõ / Mơ hồ / Quên", trang "Ôn tập" và kiểu nhập "Gộp / Thay thế" được gắn [^mm-model]. Nhưng model.ts chỉ có các khóa clear/fuzzy/forgot và merge/replace; các nhãn này nằm ở src/views/Review.tsx và src/views/DataView.tsx. | Thêm hai file này vào sources, hoặc tách supports cho đúng file. |
| learn-using-mindmap | 112, 116–122 | minor | B.6 | CLAUDE.md đòi "không còn phát hiện mức blocker hay major chưa xử lý" và điều kiện này áp cho verifiedBy: claude; bài rút gọn thành "không còn lỗi". Bước 5 ngầm cho rằng bài nào cũng lên Đã kiểm chứng, bỏ mất quy tắc của docs/kiem-chung.md: qua 3 vòng vẫn còn blocker hoặc major thì bài ở lại Nháp và báo Lam. supports có quy tắc này nhưng bài không dùng. | Thêm câu về trường hợp bài ở lại Nháp. Giữ cụm "chưa xử lý". |
| learn-using-mindmap | 162 | minor | B.6 | Câu "không ảnh hưởng gì khác" không đúng: mở bài còn ghi lastTopicId (thẻ "Tiếp tục" ở trang Hôm nay) và đưa bài vào danh sách "Đang học" ở trang đó (src/store/data.ts, Today.tsx). | Đổi thành "không ảnh hưởng tới tiến độ Đã hiểu hay lịch ôn". |
| learn-using-mindmap | 174–177 | minor | C.9, E.18 | Ví dụ MVCC được đưa ra như minh họa cho quy trình ở dòng 116–122. Nhưng bài MVCC được kiểm chứng ngày 15/10, trước khi docs/kiem-chung.md được dựng lại (29/10): changelog có dòng "Kiểm chứng" thay cho "Phản biện vòng 1". | Ghi rõ đây là lịch sử theo quy trình trước 29/10 và nêu chỗ khác biệt. |
| learn-practice-case | 73, 136 | major | B.6, E.15 | (a) Dòng 136 "Điều khoản Google cấm việc này" nói mạnh hơn nguồn. Điều khoản chỉ cấm truy cập bằng phương tiện tự động trái với chỉ dẫn máy đọc được (như robots.txt). Câu "scraping content that doesn't belong to you" chỉ là ví dụ hành vi có thể dẫn tới đình chỉ, ở mục "Suspending or terminating your access". robots.txt của play.google.com (mở 29/10/2026) chặn /store/search nhưng không có luật cho /store/apps/top hay /store/apps/category. (b) Bài kết luận "vì vậy dùng SerpApi" mà không nêu đánh đổi. Trang giá SerpApi mô tả U.S. Legal Shield là bảo hiểm cho "scraping and parsing of search engine data", tức SerpApi tự cào. Gói Free không có Legal Shield; supports của serpapi-pricing có ý này nhưng thân bài không dùng. | Viết lại dòng 73 và 136 đúng mức của nguồn ("có thể bị đình chỉ…"). Thêm một gạch đánh đổi: dùng SerpApi là chuyển việc truy cập Google sang bên thứ ba, không bảo đảm hợp lệ, và gói Free không có Legal Shield. |
| learn-practice-case | 81, 141–143 | major | B.6 | Câu "Mỗi app có title, product_id, rating, author, category, downloads" nằm trong ngữ cảnh `chart`. Nhưng phản hồi mẫu trên trang SerpApi thuộc `organic_results[].items` của một truy vấn không ghi rõ (link cho thấy gl=us, hl=en), không phải phản hồi `chart`. Không nguồn nào cho thấy phản hồi `chart` có `downloads` và `rating`, trong khi chỉ số "Game lớn nhất" và "lên mốc lượt tải" dựa vào hai trường này. | Ghi rõ mẫu lấy từ đâu. Thêm vào danh sách điều chưa biết (dòng 120): các trường của phản hồi `chart` chưa được kiểm bằng key thật, sẽ kiểm ở chặng 1. |
| learn-practice-case | 133, 151 | major | B.6, E.16, E.17 | Lỗi "đốt hết hạn mức… nguyên nhân thường là vòng retry không giới hạn" và câu hỏi 5 ("retry không giới hạn khi gọi SerpApi bị lỗi… dấu hiệu nào") mâu thuẫn với hai nguồn mà chính bài dẫn. Theo serpapi-pricing, chỉ lượt thành công bị tính; lượt lỗi hay thất bại không tính. Theo serpapi-google-play, lượt gọi trùng tham số trong vòng 1 giờ trúng cache và miễn phí. Vì vậy, retry khi SerpApi trả lỗi không làm giảm 250 lượt, và đáp án dự kiến "hết 250 lượt giữa tháng" sai với đúng kịch bản của câu hỏi. Cụm "Nguyên nhân thường là" cũng không có nguồn. | Viết lại cơ chế: lượt chỉ bị tính khi retry gọi lại SerpApi sau một lỗi phía app (lần gọi trước đã thành công) mà cache đã hết hạn hoặc có no_cache=true. Retry dồn dập khi SerpApi lỗi sẽ chạm giới hạn 50 lượt mỗi giờ. Sửa câu hỏi 5 cho khớp. |
| learn-practice-case | 84, 124 | major | B.8 | Bài có `volatility: fast`, nhưng hạn mức SerpApi (250 lượt mỗi tháng, 50 lượt mỗi giờ) không ghi ngày đọc trong thân bài. Chỉ số Azure ở dòng 110 thì có ngày. | Thêm "(bảng giá SerpApi đọc ngày 29/10/2026)" ở dòng 84 và 124. |
| learn-practice-case | 5 | minor | A.3 | summary có "đề xuất thể loại", nhưng thân bài chỉ có "Thể loại nổi bật: tổng hợp các chỉ số trên theo thể loại", không có phần đề xuất. | Đổi summary thành "tìm thể loại nổi bật", hoặc thêm nội dung tương ứng vào bài. |
| learn-practice-case | 71 | minor | B.4 | Lý do chọn app (theo sở thích của Lam, để tham khảo trước khi làm game lên Google Play) không gắn nguồn. Ý này nằm ở mục 1 của bản thiết kế, còn tiêu đề nguồn mm-practice-design chỉ ghi mục 3 và 5.3. | Gắn [^mm-practice-design] và sửa tiêu đề nguồn thành "mục 1, 3 và 5.3". |
| learn-practice-case | 119 | minor | B.6 | Câu "chỉ cho biết cận dưới[^serpapi-google-play]": trang SerpApi chỉ có giá trị mẫu "500,000,000+", không nói đó là cận dưới. Ý "cận dưới" đến từ bản thiết kế (mục 5.3). | Gắn [^mm-practice-design] cho phần diễn giải. |
| learn-lab | 92–102, 137 (supports dòng 17, 24, 31) | major | B.5 | Các nhận định cổng 5433, `127.0.0.1:${LAB_PG_PORT:-5433}:5432`, Oracle `127.0.0.1:1521`, "lab cố ý không dùng 5432" và harness mặc định 5433 chỉ đúng với bản chưa commit của lab/README.md, lab/docker-compose.yml, lab/lib/harness.mjs (git status: M). Bài đã được commit (624e6a7), còn HEAD vẫn là `5432:5432` với PGPORT mặc định 5432. Nếu ba file này không đi cùng release, bài sai so với nguồn trên main. | Commit ba file lab trước hoặc cùng bài, rồi đối chiếu lại supports với bản đã commit. |
| learn-lab | 131 | minor | B.6, D.13 | Câu "Hành vi logic… thường giống nhau, còn số đo thời gian thì khác" không có nguồn hay lab. Cả 18 lab hiện có đều chạy trong môi trường build của Claude (PostgreSQL 16.15 trên Ubuntu, hoặc Python), chưa lab nào chạy trong Docker. Vì vậy "Các lab đầu tiên" thực ra là mọi lab hiện có. Các giá trị như xmin, ctid cũng đổi theo từng lần chạy. | Ghi rõ chưa có lần chạy trong Docker để so sánh. Nêu rằng xmin, ctid và thời gian sẽ khác giữa các lần chạy. |
| learn-lab | 74, 133 | minor | C.9 | "nguồn ví dụ thứ ba là thử nghiệm chạy thật" và "ví dụ lấy từ tài liệu chính thức hoặc case công khai" bỏ sót loại research, loại practice-measurement (số đo thật từ bài thực hành, có trong CLAUDE.md) và cách ghi "Chưa có ví dụ thực tế". Với Azure ở chặng 19–20, số đo từ bài thực hành là loại ví dụ hợp lệ. | Liệt kê đủ năm loại ví dụ, hoặc liên kết tới learn-using-mindmap. |
| learn-lab | 101 | minor | B.5 | "in kèm tên phiên và thời điểm" không chính xác: harness in số mili giây tính từ lúc script bắt đầu (`stamp()`). Thời điểm tuyệt đối chỉ có ở header. | Sửa thành "kèm số mili giây tính từ lúc script chạy". |
| learn-lab | 149 | minor | B.6 | "có lệnh tạo môi trường ảo cho cả Linux lẫn Windows" nói quá: README LSM có một lệnh `python -m venv .venv` dùng chung, chỉ ghi chú Windows cho bước pip, không có lệnh Windows cho bước chạy `run.py`. | Sửa thành "lệnh cho Linux, kèm ghi chú đường dẫn pip trên Windows". |
| learn-lab | 108–113, 125 | minor | E.16 | README MVCC ghi "hoặc dùng PostgreSQL 16 có sẵn". Với harness mặc định 5433, một PostgreSQL có sẵn ở cổng 5432 cần đặt PGPORT=5432, nên câu "chạy lại bằng đúng lệnh trong README" không còn đúng cho cách này. | Nêu trong mục Lỗi thường gặp: dùng PostgreSQL có sẵn thì phải đặt PGPORT và kiểm dòng `Máy chủ:`. |
| learn-lab | 35–46 (nguồn compose-services, compose-interpolation) | minor | B.7 | Hành vi Docker Compose không ghi phiên bản, cả trong bài lẫn trường `version` của nguồn (tài liệu Docker là bản hiện hành). | Ghi phiên bản Docker Compose dùng cho lab (lấy từ `docker compose version`) kèm ngày đọc tài liệu. |

Tổng: 0 blocker, 6 major, 18 minor.

### Xử lý

Mọi phát hiện đều đã sửa (đã sửa: theo đề xuất ở từng dòng), trừ các chỗ ghi riêng dưới đây.

- learn-lab, ba file lab chưa commit (major): đã sửa: commit `lab/README.md`, `lab/docker-compose.yml`, `lab/lib/harness.mjs` trước vòng 2.
- learn-practice-case, summary "đề xuất thể loại" (minor): đã sửa bằng cách thêm vào thân bài rằng danh sách thể loại nổi bật chính là phần đề xuất của app; giữ summary vì đó là ý của Lam (bản thiết kế, mục 1).
- learn-practice-case, robots.txt của play.google.com (thông tin thêm trong phát hiện major): giữ nguyên: bài không đưa ra nhận định về robots.txt; lý do không tự cào là quyết định của Lam, và bài chỉ nêu rủi ro ở mức điều khoản viết.
- learn-lab, phiên bản Docker Compose (minor): đã sửa: ghi Docker Compose v5.5.1 (kết quả `docker compose version` trên máy Lam, 29/10/2026).

Kết luận vòng: cần vòng sau.
