---
id: aidev-reviewing-ai-code
title: Review code do AI sinh
parent: aidev-review
summary: Đọc diff do agent tạo với cùng tiêu chuẩn như code của người.
contentStatus: draft
volatility: fast
prerequisites:
  - ops-code-review
related:
  - aidev-failure-modes
  - aidev-tests-as-guardrails
  - aidev-writing-specs
sources:
  - id: gh-review-ai
    url: https://docs.github.com/en/copilot/tutorials/review-ai-generated-code
    title: "GitHub Docs — Review AI-generated code"
    supports: "Luôn chạy test tự động và phân tích tĩnh trước; kiểm code có giải đúng vấn đề và theo quy ước không; không nhận code khó theo dõi hoặc sửa còn lâu hơn viết lại; kiểm package được gợi ý có tồn tại và còn được bảo trì không, cảnh giác package bịa ra; để ý API bịa ra, ràng buộc bị bỏ qua, logic sai; để ý test bị xóa hoặc bỏ qua thay vì được sửa; hoài nghi code trông đúng nhưng không khớp ý định; thay đổi phức tạp hoặc nhạy cảm cần đồng đội review."
    product: GitHub Copilot
    version: "tài liệu bản hiện hành"
    checkedAt: 2026-11-02
  - id: google-review
    url: https://google.github.io/eng-practices/review/reviewer/looking-for.html
    title: "Google Engineering Practices — What to look for in a code review"
    supports: "Điều quan trọng nhất là thiết kế tổng thể của thay đổi. Kiểm chức năng có đúng ý định không, độ phức tạp, test (người phải bảo đảm test hợp lệ, và test có thật sự fail khi code hỏng không), tên, comment, tài liệu. Đọc mọi dòng code được giao review; không hiểu thì hỏi lại. Nhìn ra ngoài diff, không nhận thay đổi làm giảm sức khỏe của hệ thống."
    product: Google Engineering Practices
    checkedAt: 2026-11-02
  - id: perry-2023
    url: https://arxiv.org/abs/2211.03622
    title: "Perry, Srivastava, Kumar, Boneh — Do Users Write More Insecure Code with AI Assistants? (CCS 2023)"
    supports: "Trong nghiên cứu người dùng, người tham gia có trợ lý AI dựa trên model codex-davinci-002 viết code kém an toàn hơn đáng kể so với người không có, và có xu hướng tin hơn rằng mình đã viết code an toàn."
    product: Nghiên cứu người dùng, CCS 2023
    version: "model codex-davinci-002"
    checkedAt: 2026-11-02
  - id: cc-best
    url: https://code.claude.com/docs/en/best-practices
    title: "Claude Code Docs — Best practices"
    supports: "Claude dừng khi việc trông có vẻ xong. /code-review xem diff trong một subagent mới, chưa thấy cuộc trò chuyện, nên không bị lý luận đã tạo ra code ảnh hưởng. Hãy đòi bằng chứng: lệnh đã chạy và output của nó; câu 'mọi test đều pass' tự nó nói rất ít. Có thể viết prompt review đối chiếu diff với SPEC.md. Người review được yêu cầu tìm lỗi sẽ luôn tìm ra thứ gì đó; sửa mọi phát hiện thì thêm lớp trừu tượng và test cho trường hợp không thể xảy ra."
    product: Claude Code
    version: "tài liệu bản hiện hành, máy Lam chạy 2.1.201"
    checkedAt: 2026-11-02
examples:
  - id: perry-study
    kind: research
    title: "Perry và cộng sự, CCS 2023: người dùng trợ lý AI viết code kém an toàn hơn nhưng tự tin hơn"
    url: https://arxiv.org/abs/2211.03622
    checkedAt: 2026-11-02
  - id: gh-review-steps
    kind: official-doc
    title: "GitHub Docs: các bước review code do AI sinh"
    url: https://docs.github.com/en/copilot/tutorials/review-ai-generated-code
    checkedAt: 2026-11-02
changelog:
  - date: 2026-11-02
    note: "Claude soạn bài từ GitHub Docs, Google Engineering Practices, tài liệu Claude Code và phần tóm tắt của nghiên cứu Perry và cộng sự."
---

## Vấn đề cần giải quyết

Coding agent viết code nhanh hơn người đọc. Diff lớn, trông gọn gàng, comment đầy đủ, nên rất dễ lướt qua và bấm merge. Nhưng người merge vẫn chịu trách nhiệm cho code đó.

Cảm giác "trông đúng" là cái bẫy chính. Một nghiên cứu người dùng công bố tại CCS 2023 cho thấy người tham gia có trợ lý AI viết code kém an toàn hơn đáng kể, đồng thời tin hơn rằng mình đã viết code an toàn[^perry-2023]. GitHub cũng khuyên hoài nghi những đoạn code trông đúng nhưng không khớp với ý định[^gh-review-ai].

## Cơ chế và luồng hoạt động

**Nguyên tắc: cùng tiêu chuẩn với code của người.** Những gì cần xem không đổi: thiết kế tổng thể, chức năng có đúng ý định không, độ phức tạp, test, tên, tài liệu; đọc mọi dòng được giao; không hiểu thì hỏi lại; và nhìn ra ngoài diff[^google-review]. Bài Code review (chặng 18) nói kỹ phần này. Bài này chỉ thêm những gì riêng với code do agent sinh.

**Thứ tự review đề xuất** (bài này ghép từ GitHub Docs và tài liệu Claude Code):

1. **Chạy kiểm tra tự động trước.** GitHub khuyên luôn chạy test tự động và phân tích tĩnh trước[^gh-review-ai]. Đòi bằng chứng là lệnh đã chạy và output của nó; câu "mọi test đều pass" tự nó nói rất ít[^cc-best].
2. **So với yêu cầu.** Code có giải đúng vấn đề không, có theo quy ước của dự án không[^gh-review-ai]. Nếu có spec, đối chiếu từng yêu cầu với diff[^cc-best].
3. **Xem test đã đổi gì.** Để ý test bị xóa hoặc bỏ qua thay vì được sửa[^gh-review-ai]. Test cũng cần người xem: chúng có thật sự fail khi code hỏng không[^google-review].
4. **Kiểm dependency mới.** Package được gợi ý có tồn tại, còn được bảo trì không, nguồn gốc và giấy phép ra sao[^gh-review-ai].
5. **Tìm lỗi đặc trưng của AI.** API bịa ra, ràng buộc bị bỏ qua, logic sai[^gh-review-ai].
6. **Đọc mọi dòng còn lại**, như với diff của đồng nghiệp[^google-review].

**Người review không viết code thì nhìn tốt hơn.** Tài liệu Claude Code mô tả `/code-review` xem diff trong một subagent mới, chưa thấy cuộc trò chuyện, nên không bị lý luận đã tạo ra code ảnh hưởng[^cc-best]. Cách này hỗ trợ người review, không thay người review.

## Điều kiện áp dụng, lợi ích và đánh đổi

**Lợi ích.** Chặn lỗi trước khi merge, và giữ được hiểu biết về code của chính mình.

**Đánh đổi.**

- **Tốn thời gian đọc.** Agent càng nhanh thì phần đọc càng chiếm nhiều thời gian. Giữ thay đổi nhỏ là cách rẻ nhất để review được.
- **Review bằng agent có giới hạn.** Người review được yêu cầu tìm lỗi sẽ luôn tìm ra thứ gì đó. Sửa mọi phát hiện thì sinh ra thêm lớp trừu tượng và test cho trường hợp không thể xảy ra[^cc-best]. Bạn vẫn phải chọn phát hiện nào đáng sửa.
- **Khi nào viết lại thay vì sửa.** GitHub khuyên không nhận code khó theo dõi, hoặc code mà sửa còn lâu hơn viết lại[^gh-review-ai].

**Khi nào cần thêm người.** Thay đổi phức tạp hoặc nhạy cảm nên có đồng đội review[^gh-review-ai].

**Giới hạn của bằng chứng.** Nghiên cứu Perry và cộng sự dùng model `codex-davinci-002`, một thế hệ model cũ[^perry-2023]. Không nên coi kết quả đó là mô tả chính xác cho công cụ hiện nay. Điều vẫn dùng được là cảnh báo về sự tự tin: có công cụ hỗ trợ không làm bạn bớt phải kiểm tra.

## Lỗi thường gặp và dấu hiệu nhận biết

- **Tin câu "đã xong, test pass".** Agent dừng khi việc trông có vẻ xong[^cc-best]. Dấu hiệu: không có lệnh và output kèm theo. Hãy đòi output, hoặc tự chạy.
- **Bỏ qua test bị sửa.** Dấu hiệu: diff có `.skip`, test bị xóa, hoặc giá trị mong đợi bị đổi cho khớp code mới[^gh-review-ai].
- **Nhận package lạ.** Dấu hiệu: `package.json` có dependency bạn chưa từng nghe, ít lượt tải, hoặc tên gần giống một package nổi tiếng. Package có thể không tồn tại thật[^gh-review-ai].
- **Tin một API có vẻ hợp lý.** Dấu hiệu: một hàm hay tùy chọn cấu hình bạn không tìm thấy trong tài liệu của đúng phiên bản đang dùng[^gh-review-ai].
- **Chỉ đọc code mới, không đọc ngữ cảnh.** Dấu hiệu: code đúng nếu xét riêng, nhưng trùng một helper đã có, hoặc phá quy ước của module. Google khuyên nhìn ra ngoài diff[^google-review].
- **Merge code bạn không giải thích được.** Dấu hiệu: đồng nghiệp hỏi vì sao viết vậy và bạn phải hỏi lại agent.
- **Sửa mọi góp ý của agent review.** Dấu hiệu: diff ngày càng phình ra vì các trường hợp không xảy ra được[^cc-best].

## Ví dụ thực tế

- [ex:perry-study] — Perry, Srivastava, Kumar và Boneh, CCS 2023: trong nghiên cứu người dùng, nhóm có trợ lý AI dựa trên `codex-davinci-002` viết code kém an toàn hơn đáng kể so với nhóm không có, và tin hơn rằng code của mình an toàn[^perry-2023]. Phần tóm tắt không nêu con số cụ thể; bài này chỉ đọc phần tóm tắt.
- [ex:gh-review-steps] — GitHub Docs liệt kê các bước review code do AI sinh: chạy kiểm tra tự động, kiểm ngữ cảnh và ý định, đánh giá chất lượng, soi dependency, tìm lỗi đặc trưng của AI, và review cùng đồng đội[^gh-review-ai].

## Câu hỏi tự kiểm tra

- Agent báo "đã sửa xong, mọi test đều pass". Liệt kê những gì bạn kiểm tra trước khi merge, theo thứ tự.
- Diff của agent đổi `expect(total).toBe(100)` thành `expect(total).toBe(90)`. Bạn đọc điều này thế nào, và cần trả lời câu hỏi gì trước khi nhận?
- Agent thêm một package bạn chưa từng nghe. Bạn kiểm tra những gì?
- Vì sao một agent review trong session mới có thể thấy điều mà session viết code không thấy? Vì sao không nên sửa mọi thứ nó nêu ra?
- Nghiên cứu Perry và cộng sự cho thấy điều gì về sự tự tin? Vì sao không nên áp nguyên kết quả đó cho công cụ hiện nay?

## Chủ đề liên quan và nguồn kiểm chứng
