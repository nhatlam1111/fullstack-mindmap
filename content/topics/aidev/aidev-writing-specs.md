---
id: aidev-writing-specs
title: Viết spec cho coding agent
parent: aidev-specs
summary: Mục tiêu, phạm vi, ràng buộc và tiêu chí nghiệm thu đủ để agent làm đúng.
contentStatus: verified
verifiedAt: 2026-10-15
verifiedBy: claude
volatility: fast
prerequisites: []
related:
  - aidev-task-breakdown
  - aidev-repo-context
  - aidev-tests-as-guardrails
  - aidev-when-not-to-use
sources:
  - id: cc-best
    url: https://code.claude.com/docs/en/best-practices
    title: "Claude Code Docs — Best practices for Claude Code"
    supports: "Claude Code đọc file, chạy lệnh, sửa code và tự làm qua vấn đề; Claude dừng khi công việc trông như xong, không có bước kiểm chạy được thì người dùng thành vòng kiểm tra; nên cho một kiểm tra trả về đạt hoặc không đạt như test suite, mã thoát của build, linter; yêu cầu bằng chứng thay vì khẳng định thành công; quy trình explore, plan, implement, commit; với việc phạm vi rõ và sửa nhỏ thì yêu cầu làm trực tiếp, mô tả được diff trong một câu thì bỏ lập kế hoạch, lập kế hoạch hữu ích khi chưa chắc hướng làm, sửa nhiều file hoặc chưa quen code; Claude không đọc được ý người dùng, nên chỉ file, ràng buộc, mẫu có sẵn; bảng ví dụ trước/sau (fix the login bug, add tests for foo.py, validateEmail); prompt mơ hồ có ích khi khám phá; với tính năng lớn, cho Claude phỏng vấn rồi viết spec ra SPEC.md và mở phiên mới để thực hiện; spec hữu ích nhất là tự đủ: nêu file và interface, nói rõ ngoài phạm vi, kết thúc bằng bước kiểm chứng end-to-end; lỗi trust-then-verify gap: bản cài trông hợp lý nhưng không xử lý edge case, cách sửa là luôn cung cấp kiểm chứng; sau hai lần sửa không được thì xóa context và viết prompt ban đầu tốt hơn; CLAUDE.md quá dài khiến quy tắc quan trọng bị bỏ qua. Nhảy thẳng vào viết code có thể giải sai bài toán; plan mode có ích nhưng tốn thêm công; phiên mới thực hiện spec có context sạch và có spec để đối chiếu; review độc lập kiểm tra không có gì ngoài phạm vi bị thay đổi."
    product: Claude Code
    checkedAt: 2026-10-15
  - id: gh-best
    url: https://docs.github.com/en/copilot/tutorials/cloud-agent/get-the-best-results
    title: "GitHub Docs — Best practices for using GitHub Copilot to work on tasks (Copilot cloud agent)"
    supports: "Copilot cho kết quả tốt hơn với việc rõ ràng, phạm vi gọn; việc lý tưởng gồm mô tả rõ vấn đề hoặc việc cần làm, tiêu chí nghiệm thu đầy đủ (ví dụ có cần unit test không), chỉ dẫn file cần sửa; nên coi issue giao cho Copilot như một prompt; nên bắt đầu với việc đơn giản như sửa bug, đổi giao diện, tăng test coverage, cập nhật tài liệu; việc nên cân nhắc tự làm gồm bốn nhóm: phức tạp và phạm vi rộng (refactor rộng cần hiểu nhiều repository, vấn đề đòi hiểu dependency và code cũ, cần kiến thức nghiệp vụ sâu, nhiều logic nghiệp vụ, thay đổi lớn cần thiết kế nhất quán), nhạy cảm và quan trọng (sự cố production, bảo mật, dữ liệu định danh cá nhân, xác thực, incident response), mơ hồ (yêu cầu chưa rõ, việc mở, phải tìm đường qua điều chưa chắc), học (việc lập trình viên muốn tự làm để hiểu sâu); hướng dẫn cấp repository trong .github/copilot-instructions.md về cách build, test và chuẩn code; Copilot tự build, test, kiểm tra được thay đổi thì dễ tạo pull request merge được nhanh."
    product: GitHub Copilot cloud agent
    checkedAt: 2026-10-15
examples:
  - id: cc-before-after
    kind: official-doc
    title: "Tài liệu Claude Code: các cặp prompt trước/sau, như \"fix the login bug\" và bản cụ thể"
    url: https://code.claude.com/docs/en/best-practices
    checkedAt: 2026-10-15
  - id: gh-instructions-file
    kind: official-doc
    title: "Tài liệu GitHub: file .github/copilot-instructions.md mẫu có lệnh build, test, format"
    url: https://docs.github.com/en/copilot/tutorials/cloud-agent/get-the-best-results
    checkedAt: 2026-10-15
changelog:
  - date: 2026-10-15
    note: "Claude soạn bài từ tài liệu Claude Code và GitHub Copilot cloud agent (đối chiếu 15/10/2026)."
  - date: 2026-10-15
    note: "Phản biện: ghi rõ các giới hạn là của Claude Code theo tài liệu, chuyển ý giải sai bài toán vào luồng làm việc, liệt kê đủ bốn nhóm việc của GitHub, thêm lý do mở phiên mới và cặp ví dụ foo.py, sửa tiêu đề nguồn GitHub, ghi rõ dấu hiệu nào là kinh nghiệm của bài."
  - date: 2026-10-15
    note: "Kiểm chứng: qua phản biện độc lập, đã xử lý mọi phát hiện; chuyển sang Đã kiểm chứng."
  - date: 2026-10-29
    note: "Bỏ chỗ nhắc bài thực hành cũ; nhận định, nguồn và ví dụ không đổi."
---

## Vấn đề cần giải quyết

Coding agent không chỉ trả lời rồi chờ. Theo tài liệu Claude Code, nó đọc file, chạy lệnh, sửa code và tự làm tiếp cho tới khi xong[^cc-best]. Tài liệu đó nêu hai giới hạn của Claude Code:

- Claude suy ra được ý định nhưng không đọc được ý bạn; vì vậy cần chỉ rõ file, ràng buộc và mẫu có sẵn[^cc-best].
- Claude dừng khi công việc *trông như* đã xong. Nếu không có bước kiểm tra nó tự chạy được, bạn trở thành người kiểm tra cho mọi lỗi[^cc-best].

Spec là chỗ bạn xử lý cả hai giới hạn trước khi agent bắt đầu.

## Cơ chế và luồng hoạt động

GitHub khuyên coi issue giao cho Copilot cloud agent như một prompt[^gh-best]. Gộp hướng dẫn của GitHub và Anthropic, một spec tốt có năm phần:

| Phần | Nội dung | Nguồn nêu |
| --- | --- | --- |
| Vấn đề | Mô tả rõ vấn đề cần giải quyết hoặc việc cần làm; với lỗi thì nêu triệu chứng và chỗ nghi ngờ | GitHub[^gh-best], Anthropic[^cc-best] |
| Phạm vi | Việc gì nằm ngoài phạm vi | Anthropic[^cc-best] |
| Vị trí và mẫu | File và interface liên quan; mẫu có sẵn trong codebase để làm theo | GitHub[^gh-best], Anthropic[^cc-best] |
| Ràng buộc | Ví dụ không dùng mock, không thêm thư viện ngoài những thư viện đã có | Anthropic[^cc-best] |
| Tiêu chí nghiệm thu và cách kiểm chứng | Thế nào là đạt, kể cả có cần unit test không; một kiểm tra trả về đạt hay không đạt: test suite, mã thoát của build, linter | GitHub[^gh-best], Anthropic[^cc-best] |

Tài liệu Claude Code tóm lại: spec hữu ích nhất là spec tự đủ, nêu file và interface liên quan, nói rõ phần ngoài phạm vi, và kết thúc bằng một bước kiểm chứng end-to-end cho thấy tính năng chạy được[^cc-best].

**Luồng làm việc.** Tài liệu Claude Code ghi rằng để Claude nhảy thẳng vào viết code có thể cho ra code giải sai bài toán, nên đề xuất bốn bước: khám phá (đọc code, không sửa), lập kế hoạch, thực hiện kèm chạy test, rồi commit[^cc-best]. Với tính năng lớn, có thể để agent phỏng vấn bạn về cách làm, giao diện, edge case và đánh đổi, viết spec ra file `SPEC.md`, rồi mở một phiên mới chỉ để thực hiện spec đó. Phiên mới có context sạch, chỉ tập trung vào việc thực hiện, và bạn có spec viết sẵn để đối chiếu[^cc-best]. Khi agent làm xong, yêu cầu nó đưa bằng chứng (output test, lệnh đã chạy và kết quả) thay vì chỉ báo thành công[^cc-best].

**Phần lặp lại ở mọi việc** như lệnh build, lệnh test, chuẩn code thì không viết lại trong từng spec mà để trong file hướng dẫn của repository. Với Copilot cloud agent đó là `.github/copilot-instructions.md`[^gh-best] (xem bài Context cho agent trong repo).

## Điều kiện áp dụng, lợi ích và đánh đổi

**Không phải việc nào cũng cần lập kế hoạch.** Tài liệu Claude Code ghi rằng plan mode có ích nhưng tốn thêm công[^cc-best]. Với việc phạm vi rõ và sửa nhỏ, như sửa lỗi chính tả hay đổi tên biến, tài liệu Claude Code khuyên cứ yêu cầu làm trực tiếp: mô tả được diff trong một câu thì bỏ qua bước lập kế hoạch. Kế hoạch có ích nhất khi bạn chưa chắc hướng làm, khi thay đổi đụng nhiều file, hoặc khi bạn chưa quen phần code đó[^cc-best]. Prompt mơ hồ cũng có chỗ dùng: khi đang khám phá và chấp nhận sửa hướng giữa chừng[^cc-best].

**Không phải việc nào cũng nên giao.** GitHub liệt kê bốn nhóm việc bạn có thể muốn tự làm thay vì giao cho Copilot[^gh-best]:

- Phức tạp và phạm vi rộng: refactor rộng cần hiểu nhiều repository; vấn đề đòi hiểu dependency và code cũ; việc cần kiến thức nghiệp vụ sâu; việc có nhiều logic nghiệp vụ; thay đổi lớn cần giữ thiết kế nhất quán.
- Nhạy cảm và quan trọng: sự cố production; việc liên quan bảo mật, dữ liệu định danh cá nhân, xác thực; xử lý sự cố (incident response).
- Mơ hồ: yêu cầu chưa rõ, việc mở, việc phải tìm đường qua nhiều điều chưa chắc.
- Học: việc bạn muốn tự làm để hiểu sâu.

GitHub khuyên bắt đầu với việc đơn giản: sửa bug, đổi giao diện, tăng test coverage, cập nhật tài liệu[^gh-best].

**Lợi ích của bước kiểm chứng.** GitHub ghi rằng khi Copilot tự build, test và kiểm tra được thay đổi trong môi trường của nó, nó dễ tạo ra pull request merge được nhanh hơn[^gh-best].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Không có tiêu chí kiểm chứng.** Tài liệu Claude Code gọi đây là khoảng trống "tin rồi mới kiểm": bản cài đặt trông hợp lý nhưng không xử lý edge case. Cách sửa: luôn đưa cách kiểm chứng, như test, script hoặc ảnh chụp màn hình[^cc-best]. Dấu hiệu: agent báo xong mà không có output test hay lệnh nào đã chạy.
- **Chỉ đưa triệu chứng chung chung.** Ví dụ "fix the login bug"; tài liệu Claude Code khuyên nêu triệu chứng, chỗ nghi ngờ và thế nào là đã sửa[^cc-best]. Dấu hiệu (kinh nghiệm bài này nêu, không trích từ nguồn): agent đọc rất nhiều file mới bắt đầu sửa, hoặc sửa một chỗ không phải nguyên nhân.
- **Không nói phần ngoài phạm vi.** Tài liệu Claude Code gợi ý cho bước review độc lập kiểm tra rằng không có gì ngoài phạm vi của việc bị thay đổi[^cc-best]. Dấu hiệu: diff đụng những file không có trong spec.
- **Sửa đi sửa lại trong cùng một phiên.** Tài liệu Claude Code khuyên: sau hai lần sửa cùng một lỗi không được, xóa context và viết lại prompt ban đầu, đưa vào những gì đã học được[^cc-best].
- **CLAUDE.md quá dài (Claude Code).** Quy tắc quan trọng bị chìm và Claude bỏ qua một nửa[^cc-best]. Dấu hiệu: Claude lặp lại một việc dù CLAUDE.md đã cấm.

## Ví dụ thực tế

- [ex:cc-before-after] — tài liệu Claude Code đưa các cặp prompt trước và sau[^cc-best]:
    - "fix the login bug" thành "users report that login fails after session timeout. check the auth flow in src/auth/, especially token refresh. write a failing test that reproduces the issue, then fix it". Bản sau có triệu chứng, chỗ nghi ngờ và cách kiểm chứng.
    - "add tests for foo.py" thành "write a test for foo.py covering the edge case where the user is logged out. avoid mocks.": nêu file, kịch bản và yêu cầu về cách test.
    - "implement a function that validates email addresses" thành bản có sẵn các ca kiểm thử (`user@example.com` đúng, `invalid` sai, `user@.com` sai) và yêu cầu chạy test sau khi viết.
- [ex:gh-instructions-file] — tài liệu GitHub có file `.github/copilot-instructions.md` mẫu, liệt kê lệnh build, lệnh test, lệnh CI và quy định chạy `make fmt` trước khi commit[^gh-best].

## Câu hỏi tự kiểm tra

- Bạn cần viết đặc tả cho một ứng dụng nhỏ, đủ rõ để giao cho agent. Đặc tả cần những phần nào, và phần nào giúp agent tự biết mình đã làm xong?
- Khi nào nên bỏ qua bước lập kế hoạch và giao việc trực tiếp? Theo GitHub, những loại việc nào bạn nên cân nhắc tự làm thay vì giao cho agent?
- Viết lại yêu cầu "add tests for foo.py" theo cách tài liệu Claude Code gợi ý. Bạn đã thêm những thông tin gì, và mỗi thông tin giúp agent điều gì?
- Vì sao một spec tự đủ cho phép mở phiên mới chỉ để thực hiện, và điều đó giúp gì cho agent?

## Chủ đề liên quan và nguồn kiểm chứng
