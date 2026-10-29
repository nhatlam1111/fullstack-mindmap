---
id: learn-using-mindmap
title: Cách dùng mindmap này
parent: learn-method
summary: Trạng thái nội dung, trạng thái học, tiêu chí Đã hiểu và quy trình biên soạn bài.
contentStatus: draft
volatility: stable
prerequisites: []
related:
  - learn-six-questions
  - learn-spaced-review
  - learn-lab
sources:
  - id: mm-readme
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/README.md
    title: "fullstack-mindmap — README.md"
    supports: "App chạy ở hai nơi: artifact trên claude.ai (dữ liệu học lưu trong kho dữ liệu của artifact, theo tài khoản) và GitHub Pages (dữ liệu học lưu trong localStorage, riêng từng trình duyệt và từng thiết bị); chuyển dữ liệu giữa hai nơi bằng file sao lưu .json ở mục Dữ liệu học. Mỗi chủ đề là một file gồm frontmatter và 7 mục; ví dụ chỉ lấy từ thực tế; bài lên verified sau checklist kiểm chứng và vòng phản biện độc lập, với verifiedBy là lam hoặc claude."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: mm-claude
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/CLAUDE.md
    title: "fullstack-mindmap — CLAUDE.md (quy tắc nội dung)"
    supports: "Từ 15/10/2026 Claude hoàn thiện và kiểm chứng bài; Claude chỉ đặt verified kèm verifiedBy claude khi bài qua checklist trong docs/kiem-chung.md và vòng phản biện độc lập gần nhất không còn blocker hay major chưa xử lý. Việc học vẫn do Lam. Mọi nhận định quan trọng có nguồn đã mở đọc; ví dụ chỉ từ thực tế, không có thì ghi Chưa có ví dụ thực tế."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: mm-kiem-chung
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/docs/kiem-chung.md
    title: "fullstack-mindmap — docs/kiem-chung.md (checklist và quy trình kiểm chứng)"
    supports: "Checklist 21 điểm chia sáu nhóm (cấu trúc, nguồn, ví dụ, lab, nội dung học, metadata); ba mức phát hiện blocker, major, minor; mỗi nhóm tối đa 5 bài được một agent mới phản biện; sửa và phản biện lại tới khi vòng gần nhất sạch, tối đa 3 vòng, quá 3 vòng thì bài ở lại draft."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: mm-content-labels
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/src/content.ts
    title: "fullstack-mindmap — src/content.ts"
    supports: "Nhãn trạng thái nội dung: skeleton là Khung, draft là Nháp, verified là Đã kiểm chứng. Nhãn độ ổn định: stable là Ổn định, slow là Thay đổi chậm, fast là Thay đổi nhanh."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: mm-review-months
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/scripts/lib/schema.ts
    title: "fullstack-mindmap — scripts/lib/schema.ts"
    supports: "Hạn rà soát theo độ ổn định: stable 12 tháng, slow 6 tháng, fast 3 tháng."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: mm-article
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/src/components/TopicArticle.tsx
    title: "fullstack-mindmap — src/components/TopicArticle.tsx"
    supports: "Bài Khung hiện thông báo bài chưa được viết và chặng mà theo lộ trình nó sẽ được biên soạn. Bài Nháp có dải cảnh báo chưa qua checklist và phản biện độc lập. Bài Đã kiểm chứng quá hạn rà soát hiện dải Có thể đã cũ. Bài có nhãn Claude kiểm chứng hoặc Bạn kiểm chứng kèm ngày. Ba tiêu chí Đã hiểu: trả lời câu hỏi tự kiểm tra không xem bài; chạy lại thử nghiệm hoặc đọc kỹ ví dụ, hoặc ghi lý do không cần; ghi chú tự giải thích bằng lời của mình. Nút Đánh dấu Đã hiểu chỉ mở khi bài đã kiểm chứng và đủ ba tiêu chí."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: mm-model
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/src/store/model.ts
    title: "fullstack-mindmap — src/store/model.ts"
    supports: "Thang ôn REVIEW_LADDER là 7, 21, 60, 150 ngày. markUnderstood đặt hạn ôn đầu sau 7 ngày. applyReview: kết quả clear chuyển lên nấc kế tiếp và giữ 150 ở nấc cuối; fuzzy giữ khoảng hiện tại; forgot đưa bài về learning, bỏ tick selfTest và đặt ôn sau 7 ngày. mergeProgress: kiểu merge giữ bản có updatedAt mới hơn của mỗi chủ đề; kiểu replace lấy toàn bộ file."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: mm-review
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/src/views/Review.tsx
    title: "fullstack-mindmap — src/views/Review.tsx (trang Ôn tập)"
    supports: "Trang Ôn tập có ba nút cho bài đến hạn: Nhớ rõ (clear), Mơ hồ (fuzzy), Quên (forgot, về Đang học, ôn sau 7 ngày). Chủ đề vào danh sách ôn 7 ngày sau khi được đánh dấu Đã hiểu."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: mm-dataview
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/src/views/DataView.tsx
    title: "fullstack-mindmap — src/views/DataView.tsx (mục Dữ liệu học)"
    supports: "Mục Dữ liệu học cho xuất và nhập file sao lưu .json. Khi nhập, chọn Gộp dữ liệu (với mỗi chủ đề, giữ bản được sửa gần nhất) hoặc Thay thế dữ liệu (dữ liệu hiện tại được thay bằng nội dung file); file được kiểm tra trước, file lỗi không làm thay đổi gì; có Hoàn tác lần nhập gần nhất."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: mm-data
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/src/store/data.ts
    title: "fullstack-mindmap — src/store/data.ts"
    supports: "Khi mở một bài, app ghi bài đó vào lastTopicId (bài mở gần nhất); nếu bài có nội dung và đang Chưa học thì chuyển sang Đang học."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: mm-hooks
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/src/store/hooks.ts
    title: "fullstack-mindmap — src/store/hooks.ts"
    supports: "Nhãn trạng thái học: Chưa học, Đang học, Đã hiểu, Cần ôn."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: mm-today
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/src/views/Today.tsx
    title: "fullstack-mindmap — src/views/Today.tsx"
    supports: "Trang Hôm nay cho chọn chặng bắt đầu, hiện chặng hiện tại và nút Xong, sang chặng kế tiếp; có thẻ Tiếp tục với bài mở gần nhất và danh sách Đang học; tiến độ là số chủ đề Đã hiểu trên số chủ đề đã có bài hoặc thuộc các chặng bạn đã tới. Chặng hiện tại đổi được ở trang Lộ trình hoặc mục Dữ liệu học. Khi chưa đăng nhập claude.ai, app báo dữ liệu học chỉ lưu trên trình duyệt này; khi trang chạy ngoài claude.ai, dữ liệu chỉ lưu trên trình duyệt này và không đồng bộ sang thiết bị khác."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
examples:
  - id: mvcc-history
    kind: official-doc
    title: "Lịch sử bài MVCC trong repo: soạn ngày 14/10/2026, ba vòng phản biện, Claude kiểm chứng ngày 15/10/2026"
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/content/topics/db/db-mvcc.md
    checkedAt: 2026-10-29
changelog:
  - date: 2026-10-29
    note: Claude soạn bài từ README, CLAUDE.md, docs/kiem-chung.md và mã nguồn mindmap 0.1.0.
  - date: 2026-10-29
    note: "Phản biện vòng 1: bỏ ý đồng bộ không có nguồn, nêu trường hợp chưa đăng nhập claude.ai; gắn nhãn Ôn tập và Gộp, Thay thế vào đúng file; giữ đủ điều kiện kiểm chứng và trường hợp bài ở lại Nháp; nêu việc mở bài ghi bài mở gần nhất; ghi rõ ví dụ MVCC theo quy trình trước 29/10."
---

## Vấn đề cần giải quyết

Mindmap này vừa là tài liệu, vừa là nơi theo dõi việc học. Hai việc đó cần hai loại trạng thái khác nhau:

- **Bài đáng tin tới đâu?** Một bài chưa viết, một bài mới soạn và một bài đã qua kiểm chứng phải được đọc với mức tin khác nhau.
- **Bạn hiểu tới đâu?** Đọc xong một bài chưa có nghĩa là hiểu. Hiểu rồi mà không ôn thì sẽ quên.

Nếu không tách hai loại trạng thái, bạn dễ học thuộc một bài nháp còn sai, hoặc đánh dấu "đã hiểu" chỉ vì đã đọc. Bài này giải thích từng trạng thái, điều kiện để chuyển trạng thái, và cách bài được biên soạn.

## Cơ chế và luồng hoạt động

**Trạng thái nội dung** cho biết bài đáng tin tới đâu[^mm-content-labels]:

| Nhãn | Ý nghĩa |
|---|---|
| Khung | Mới có tên, tóm tắt và liên kết; chưa có thân bài. App ghi chặng mà bài sẽ được biên soạn[^mm-article]. |
| Nháp | Đã soạn từ nguồn nhưng chưa qua checklist và vòng phản biện độc lập. App hiện dải cảnh báo ở đầu bài[^mm-article]. |
| Đã kiểm chứng | Đã qua checklist trong `docs/kiem-chung.md` và vòng phản biện độc lập gần nhất không còn phát hiện mức blocker hay major chưa xử lý[^mm-claude]. App ghi "Claude kiểm chứng" hoặc "Bạn kiểm chứng" kèm ngày[^mm-article]. |

**Độ ổn định** quyết định bao lâu thì bài phải được rà lại: Ổn định 12 tháng, Thay đổi chậm 6 tháng, Thay đổi nhanh 3 tháng[^mm-review-months]. Bài đã kiểm chứng mà quá hạn rà soát sẽ hiện dải "Có thể đã cũ"[^mm-article].

**Quy trình biên soạn.** Một bài đi từ Khung lên Đã kiểm chứng qua các bước sau[^mm-kiem-chung]:

1. Claude đọc nguồn gốc, viết đủ 7 mục, chạy lab nếu chủ đề có hành vi chạy thử được. Bài chuyển sang Nháp.
2. Claude tự đối chiếu checklist 21 điểm.
3. Một agent mới, không biết gì về phiên viết, phản biện từng nhóm tối đa 5 bài, tự mở nguồn để so từng câu.
4. Sửa các lỗi blocker và major, rồi phản biện lại bằng một agent mới khác. Lặp tới khi vòng gần nhất sạch, tối đa 3 vòng.
5. Bài lên Đã kiểm chứng. Nếu qua 3 vòng mà vẫn còn lỗi blocker hoặc major, bài ở lại Nháp và Claude báo Lam.

Mỗi lần soạn và mỗi vòng phản biện có một dòng trong `changelog` của bài.

**Trạng thái học** là của bạn, không phải của bài. App có bốn nhãn: Chưa học, Đang học, Đã hiểu, Cần ôn[^mm-hooks].

- **Chưa học → Đang học:** khi bạn mở một bài có nội dung lần đầu[^mm-data].
- **Đang học → Đã hiểu:** khi bạn bấm "Đánh dấu Đã hiểu". Nút chỉ mở khi bài đã kiểm chứng và bạn tick đủ ba tiêu chí[^mm-article]:
    1. trả lời được các câu hỏi tự kiểm tra mà không xem bài;
    2. chạy lại thử nghiệm trong lab hoặc đọc kỹ ví dụ thực tế, hoặc ghi lý do không cần;
    3. có ghi chú tự giải thích bằng lời của mình.
- **Đã hiểu → Cần ôn:** khi tới hạn ôn. Lần ôn đầu là 7 ngày sau khi đánh dấu Đã hiểu[^mm-model].

**Ôn tập theo thang 7 → 21 → 60 → 150 ngày**[^mm-model]. Ở trang Ôn tập, mỗi bài đến hạn có ba lựa chọn[^mm-review][^mm-model]:

- **Nhớ rõ:** lên nấc kế tiếp; ở nấc 150 ngày thì giữ 150.
- **Mơ hồ:** giữ khoảng ôn hiện tại.
- **Quên:** bài về Đang học, tiêu chí "trả lời câu hỏi tự kiểm tra" bị bỏ tick, ôn lại sau 7 ngày.

**Chặng.** Lộ trình chia thành các chặng, không gắn ngày. Ở trang Hôm nay, bạn chọn chặng bắt đầu, rồi bấm "Xong, sang chặng" kế tiếp khi xong chặng. Chặng hiện tại cũng đổi được ở trang Lộ trình hoặc mục Dữ liệu học[^mm-today].

**Dữ liệu học** nằm ở hai nơi khác nhau, tùy nơi bạn mở app[^mm-readme]:

- **Artifact trên claude.ai:** lưu trong kho dữ liệu của artifact, theo tài khoản claude.ai. Nếu bạn chưa đăng nhập claude.ai, app báo dữ liệu học chỉ lưu trên trình duyệt đó[^mm-today].
- **GitHub Pages:** lưu trong `localStorage`, riêng từng trình duyệt và từng thiết bị.

Muốn chuyển dữ liệu giữa hai nơi, xuất file sao lưu `.json` ở mục Dữ liệu học rồi nhập ở nơi kia[^mm-readme]. Khi nhập, kiểu "Gộp dữ liệu" giữ bản được sửa gần nhất của mỗi chủ đề, còn kiểu "Thay thế dữ liệu" lấy toàn bộ file. File được kiểm tra trước khi nhập, và có nút hoàn tác lần nhập gần nhất[^mm-dataview][^mm-model].

## Điều kiện áp dụng, lợi ích và đánh đổi

**Lợi ích.**

- Bạn biết ngay một bài đáng tin tới đâu trước khi học nó.
- "Đã hiểu" có nghĩa cụ thể: đã tự trả lời, đã kiểm chứng bằng lab hoặc ví dụ, đã tự giải thích. Không phải "đã đọc".
- Thang ôn đưa bài trở lại đúng lúc, không cần tự nhớ lịch.

**Đánh đổi.**

- **Không đánh dấu Đã hiểu được bài Nháp**[^mm-article], kể cả khi bạn tự tin đã hiểu. Bài Nháp vẫn đọc và ghi chú được, nhưng phải chờ bài lên Đã kiểm chứng.
- **Kiểm chứng không có nghĩa là không thể sai.** Checklist và phản biện giảm lỗi, nhưng bài vẫn có thể sai hoặc cũ. Vì thế mỗi bài có nguồn và hạn rà soát.
- **Ba tiêu chí là tự khai.** App không kiểm tra được bạn đã thật sự trả lời hay chưa. Tick mà không làm thì "Đã hiểu" mất nghĩa.

**Khi nào không cần theo đủ quy trình.** Khi bạn chỉ tra cứu nhanh một dữ kiện, cứ mở bài đọc. Việc mở bài sẽ chuyển nó sang Đang học và ghi nó làm bài mở gần nhất ở thẻ "Tiếp tục" của trang Hôm nay[^mm-data][^mm-today], nhưng không ảnh hưởng tới tiến độ Đã hiểu hay lịch ôn.

## Lỗi thường gặp và dấu hiệu nhận biết

- **Học thuộc bài Nháp như sự thật.** Dấu hiệu: bài có dải "Nháp — chưa kiểm chứng" ở đầu[^mm-article]. Với bài Nháp, đối chiếu nguồn trước khi tin một nhận định.
- **Tick ba tiêu chí cho có.** Dấu hiệu: ô ghi chú trống hoặc chép nguyên văn bài, hay gấp bài lại thì không trả lời được câu hỏi tự kiểm tra.
- **Chọn "Nhớ rõ" khi thật ra chỉ thấy quen.** Dấu hiệu: bài lên 60 hoặc 150 ngày rồi lần ôn sau không nhớ gì. Chọn "Mơ hồ" hoặc "Quên" khi không tự trả lời được.
- **Bỏ qua dải "Có thể đã cũ".** Dấu hiệu: bài quá hạn rà soát theo độ ổn định của nó[^mm-review-months]. Với bài Thay đổi nhanh (cloud, AI), nhận định về sản phẩm có thể đã khác.
- **Chỉ dùng bản GitHub Pages mà không sao lưu.** Dấu hiệu: dữ liệu học nằm trong một trình duyệt duy nhất[^mm-readme]. Xóa dữ liệu trình duyệt hay đổi máy là mất. Xuất file `.json` định kỳ, hoặc dùng bản artifact.

## Ví dụ thực tế

- [ex:mvcc-history] — lịch sử bài MVCC trong repo cho thấy một bài đi qua soạn, kiểm chứng và phản biện thế nào. Bài này được kiểm chứng ngày 15/10/2026, trước khi checklist trong `docs/kiem-chung.md` được dựng lại (29/10/2026), nên vòng đầu được ghi là "Kiểm chứng" thay vì "Phản biện vòng 1":
    - `changelog` có dòng ngày 14/10/2026: Claude soạn bản nháp đầu và chạy thử nghiệm trên PostgreSQL 16.15.
    - Cùng ngày có dòng "Kiểm chứng", rồi ngày 15/10/2026 có "Phản biện vòng 2" và "Phản biện vòng 3". Mỗi dòng ghi những gì đã sửa, ví dụ sửa câu "đọc không cần khóa" thành "khóa đọc không xung đột với khóa ghi".
    - Frontmatter có `contentStatus: verified`, `verifiedAt: 2026-10-15`, `verifiedBy: claude`. Đây là thông tin app dùng để hiện nhãn "Claude kiểm chứng" kèm ngày[^mm-article].

## Câu hỏi tự kiểm tra

- Một bài đang ở trạng thái Nháp. Bạn đọc, ghi chú và tự trả lời được hết câu hỏi tự kiểm tra. Bạn có đánh dấu Đã hiểu được không? Vì sao app chọn cách đó?
- Bạn đánh dấu Đã hiểu một bài hôm nay. Lần ôn đầu là khi nào? Nếu lần đó bạn chọn "Nhớ rõ", lần tiếp theo cách bao lâu? Nếu chọn "Quên" thì chuyện gì xảy ra với bài?
- Một bài về Azure có độ ổn định "Thay đổi nhanh" và đã kiểm chứng cách đây 4 tháng. App hiện gì ở đầu bài, và bạn nên làm gì trước khi dựa vào nó?
- Bạn học trên GitHub Pages ở máy công ty, rồi muốn học tiếp trên artifact ở nhà. Dữ liệu học của bạn đang nằm ở đâu, và bạn chuyển nó sang bằng cách nào? Nên chọn kiểu nhập nào nếu ở nhà bạn cũng đã có ghi chú?

## Chủ đề liên quan và nguồn kiểm chứng
