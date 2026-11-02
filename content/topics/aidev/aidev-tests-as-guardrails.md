---
id: aidev-tests-as-guardrails
title: Test làm lưới an toàn
parent: aidev-review
summary: Dùng test có sẵn và test viết trước để chặn thay đổi sai của agent.
contentStatus: draft
volatility: fast
prerequisites:
  - aidev-reviewing-ai-code
related:
  - ai-evals
  - aidev-repo-context
  - fe-testing
  - be-integration-testing
sources:
  - id: cc-best
    url: https://code.claude.com/docs/en/best-practices
    title: "Claude Code Docs — Best practices for Claude Code"
    supports: "Claude dừng khi việc trông có vẻ xong; không có gì để chạy thì 'trông có vẻ xong' là tất cả, và bạn trở thành bộ test. Hãy cho nó thứ chạy được và trả về pass hoặc fail: nó sửa, chạy kiểm tra, đọc output rồi sửa tiếp. Ví dụ prompt: viết một test fail tái hiện lỗi rồi mới sửa. Bảng phân loại: khi nào xong có dạng không tất định là yêu cầu bằng chứng, /goal, /code-review; dạng tất định là test, typecheck, Stop hook, CI. Stop hook chạy script khi Claude định kết thúc lượt và đưa Claude quay lại làm tiếp nếu script thoát với mã 2; ví dụ typecheck. Nếu hook chặn tám lần liên tiếp mà không có lời gọi công cụ nào ở giữa, Claude Code bỏ qua lần chặn tiếp theo và kết thúc lượt. /goal đặt một điều kiện mà một model riêng kiểm sau mỗi lượt. Hãy đòi bằng chứng là lệnh đã chạy và output."
    product: Claude Code
    version: "tài liệu đọc 02/11/2026, khi bản mới nhất là 2.1.316"
    checkedAt: 2026-11-02
  - id: gh-review-ai
    url: https://docs.github.com/en/copilot/tutorials/review-ai-generated-code
    title: "GitHub Docs — Review AI-generated code"
    supports: "Luôn chạy test tự động và phân tích tĩnh trước; để ý test bị xóa hoặc bỏ qua thay vì được sửa."
    product: GitHub Copilot
    version: "tài liệu bản hiện hành"
    checkedAt: 2026-11-02
  - id: google-review
    url: https://google.github.io/eng-practices/review/reviewer/looking-for.html
    title: "Google Engineering Practices — What to look for in a code review"
    supports: "Người phải bảo đảm test hợp lệ; hỏi xem test có thật sự fail khi code hỏng không; không chấp nhận độ phức tạp trong test chỉ vì chúng không thuộc binary chính."
    product: Google Engineering Practices
    checkedAt: 2026-11-02
  - id: pages-workflow
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/.github/workflows/pages.yml
    title: "fullstack-mindmap — .github/workflows/pages.yml"
    supports: "Workflow chạy khi push lên main. Job build chạy npm ci, biên dịch nội dung, typecheck, lint, validate, npm test và build; job deploy có needs: build, nên build fail thì không deploy. Workflow này không chạy test end-to-end."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-11-02
  - id: release-script
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/scripts/release.ts
    title: "fullstack-mindmap — scripts/release.ts"
    supports: "Lệnh release chạy lần lượt: biên dịch nội dung, typecheck, lint, kiểm tra nội dung, unit test, build, test end-to-end; một bước lỗi thì in lỗi, in Không publish và thoát mã 1. Việc publish do Claude thực hiện bằng công cụ Artifact, không chạy từ script."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-11-02
  - id: cc-changelog
    url: https://code.claude.com/docs/en/changelog
    title: "Claude Code Docs — Changelog"
    supports: "Ngày 02/11/2026, mục mới nhất của trang là bản 2.1.316, ngày 31/10/2026."
    product: Claude Code
    version: "2.1.316"
    checkedAt: 2026-11-02
examples:
  - id: this-repo-release
    kind: official-doc
    title: "Lệnh release của repo này: bảy bước kiểm tra, bước lỗi thì dừng và báo không publish"
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/scripts/release.ts
    checkedAt: 2026-11-02
  - id: this-repo-pages
    kind: official-doc
    title: "Workflow GitHub Pages của repo này: deploy chỉ chạy khi job build thành công"
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/.github/workflows/pages.yml
    checkedAt: 2026-11-02
  - id: cc-stop-hook
    kind: official-doc
    title: "Tài liệu Claude Code: Stop hook chạy typecheck, chặn agent kết thúc khi còn lỗi"
    url: https://code.claude.com/docs/en/best-practices
    checkedAt: 2026-11-02
changelog:
  - date: 2026-11-02
    note: "Claude soạn bài từ tài liệu Claude Code, GitHub Docs, Google Engineering Practices và scripts/release.ts của repo này."
  - date: 2026-11-02
    note: "Phản biện vòng 1: viết lại ví dụ release, nêu rõ không publish vẫn là chỉ dẫn và thêm ví dụ tất định là workflow Pages; ghi giới hạn tám lần chặn của Stop hook; test chỉ tất định khi gắn vào hook hoặc CI; ghi ngày đọc tài liệu; đánh dấu các ý là kinh nghiệm của bài; sửa tên bài liên quan."
  - date: 2026-11-02
    note: "Phản biện vòng 2: ghi bản Claude Code mới nhất ở ngày đọc, thêm nguồn changelog."
---

## Vấn đề cần giải quyết

Tài liệu Claude Code (đọc ngày 02/11/2026, khi bản mới nhất là 2.1.316[^cc-changelog]) viết rằng Claude dừng khi việc trông có vẻ xong. Nếu không có gì để chạy và cho biết việc đã xong thật chưa, thì "trông có vẻ xong" là tất cả những gì nó có. Hệ quả được mô tả rất thẳng: bạn trở thành bộ test, và mỗi lỗi nằm đó cho tới khi bạn tình cờ nhận ra[^cc-best].

Test đổi chuyện đó. Thay vì đọc để đoán xem code có đúng không, bạn có một thứ trả lời pass hoặc fail mà agent tự chạy được.

## Cơ chế và luồng hoạt động

**Vòng lặp tự sửa.** Có thứ trả về pass hoặc fail thì agent tự khép được vòng: sửa code, chạy kiểm tra, đọc output, sửa tiếp[^cc-best]. Vì vậy test không chỉ để phát hiện lỗi cuối cùng, mà còn là tín hiệu định hướng trong lúc agent làm việc.

**Test có sẵn chặn việc làm hỏng thứ đang chạy.** Trước khi giao việc, cho agent biết lệnh test chính xác (xem bài Context cho agent trong repo). Sau khi agent sửa, test cũ fail thường nghĩa là hành vi cũ đã đổi: hoặc đó là lỗi, hoặc yêu cầu đã đổi và bạn phải tự quyết định. Trường hợp còn lại là test không ổn định hoặc lỗi môi trường, nên đọc output trước khi kết luận.

**Test viết trước chốt yêu cầu.** Với lỗi, viết một test fail tái hiện lỗi rồi mới sửa; tài liệu Claude Code dùng đúng cách này trong ví dụ prompt[^cc-best]. Với tính năng mới, một cách là viết test mô tả hành vi mong đợi trước khi giao: test fail mà agent phải làm cho pass chính là định nghĩa "xong"[^cc-best]. Nói rõ là không được sửa test.

**Ép buộc thay vì nhờ.** Bảng phân loại của tài liệu Claude Code tách hai cách xác định "khi nào xong"[^cc-best]:

| Loại | Cách | Bảo đảm |
|---|---|---|
| Không tất định | yêu cầu bằng chứng, `/goal`, `/code-review` | model đọc rồi tự quyết định |
| Tất định | test, typecheck, `Stop` hook, CI | chạy bởi công cụ, không do model quyết định, khi đã cấu hình vào hook hoặc CI |

Test chỉ thuộc loại thứ hai khi được gắn vào hook hoặc CI; nếu chỉ dặn trong prompt, agent tự quyết định khi nào là đủ[^cc-best]. `/goal` đặt một điều kiện mà một model riêng kiểm sau mỗi lượt. `Stop` hook chạy script của bạn khi agent định kết thúc lượt, và đưa agent quay lại làm tiếp nếu script thoát với mã 2. Nếu hook chặn tám lần liên tiếp mà không có lời gọi công cụ nào ở giữa, Claude Code bỏ qua lần chặn tiếp theo và kết thúc lượt[^cc-best]. CI là lớp cuối: không phụ thuộc vào việc agent có chạy test hay không.

**Test cũng cần được kiểm.** Người phải bảo đảm test hợp lệ, và hỏi xem test có thật sự fail khi code hỏng không[^google-review]. Agent có thể làm test pass bằng cách sửa test. GitHub khuyên để ý test bị xóa hoặc bỏ qua thay vì được sửa[^gh-review-ai].

## Điều kiện áp dụng, lợi ích và đánh đổi

**Lợi ích.**

- Agent tự chạy tiếp được, bạn không phải ngồi canh[^cc-best].
- Thay đổi lớn có lưới an toàn: refactor mà test vẫn pass thì hành vi đã kiểm vẫn giữ nguyên.
- Test đọc được như một phần của spec.

**Đánh đổi.**

- **Test chỉ chặn được những gì nó kiểm.** Test pass không có nghĩa là code đúng với yêu cầu, chỉ có nghĩa là các trường hợp đã viết không fail. Vẫn cần review (xem bài Review code do AI sinh).
- **Test do chính agent viết** (kinh nghiệm bài này nêu). Agent viết cả code lẫn test thì test dễ mang theo cách hiểu của nó, gồm cả chỗ hiểu sai. Với hành vi quan trọng, tự viết test hoặc đọc kỹ test trước khi cho agent code.
- **Test chậm làm vòng lặp chậm** (suy luận của bài). Agent chạy test nhiều lần, nên file hướng dẫn cần ghi cách chạy một file test[^cc-best].
- **Đừng thêm test cho trường hợp không thể xảy ra.** Sửa mọi góp ý của người review dễ sinh ra test như vậy[^cc-best]. Cũng không chấp nhận độ phức tạp trong test chỉ vì chúng không thuộc code chính[^google-review].

**Khi nào không đủ.** Với hành vi khó viết thành pass hoặc fail, như chất lượng câu trả lời của LLM, cần cách đánh giá khác (xem bài Evals). Giao diện cần có người hoặc công cụ xem kết quả thật; lệnh `/verify` của Claude Code cho agent build, chạy app và xem kết quả[^cc-best].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Không có gì để agent chạy.** Dấu hiệu: agent báo xong sau khi sửa code, không có lệnh và output nào[^cc-best].
- **Agent sửa test để pass.** Dấu hiệu: diff đổi giá trị mong đợi, thêm `.skip`, hoặc xóa test[^gh-review-ai]. Nói rõ trong yêu cầu là không được sửa test, và xem phần test trong diff trước.
- **Test không fail khi code hỏng.** Dấu hiệu: bạn cố ý làm hỏng code mà test vẫn xanh[^google-review]. Thử làm hỏng một dòng để xem test có bắt được không.
- **Test chỉ kiểm mock** (kinh nghiệm bài này nêu). Dấu hiệu: test pass kể cả khi hàm thật bị xóa phần xử lý chính. Các bài Kiểm thử frontend và Kiểm thử tích hợp sẽ nói kỹ phần này.
- **Tin "all tests pass" mà không có output.** Câu đó tự nó nói rất ít; hãy đòi lệnh và output[^cc-best].
- **CI không chặn merge.** Dấu hiệu: pull request fail test vẫn merge được. Bật branch protection (chặng 18).

## Ví dụ thực tế

- [ex:this-repo-release] — `scripts/release.ts` của repo này chạy lần lượt biên dịch nội dung, typecheck, lint, kiểm tra nội dung, unit test, build và test end-to-end. Bước nào lỗi thì script dừng, in "Không publish" và thoát mã 1[^release-script]. Nhưng việc publish do agent làm bằng công cụ riêng, nên "không publish" ở đây vẫn là chỉ dẫn, thuộc loại không tất định trong bảng trên.
- [ex:this-repo-pages] — workflow GitHub Pages của repo này là ví dụ tất định: job `deploy` có `needs: build`, nên build fail thì không deploy, dù ai push[^pages-workflow]. Workflow này không chạy test end-to-end, nên nó không thay được lệnh release.
- [ex:cc-stop-hook] — tài liệu Claude Code mô tả một `Stop` hook chạy typecheck: khi agent định kết thúc mà còn lỗi kiểu, script thoát với mã 2, lỗi của compiler được trả lại cho agent, và agent làm tiếp, trong giới hạn tám lần chặn liên tiếp nói trên[^cc-best].

## Câu hỏi tự kiểm tra

- Bạn giao agent sửa một lỗi tính tiền. Bạn yêu cầu nó làm gì đầu tiên, và vì sao trình tự đó quan trọng?
- Agent báo test pass, nhưng diff đổi giá trị mong đợi trong một test. Bạn xử lý thế nào?
- Vì sao `Stop` hook và CI mạnh hơn dòng "nhớ chạy test" trong file hướng dẫn? Trong ví dụ của repo này, chỗ nào là tất định, chỗ nào chỉ là chỉ dẫn?
- Làm sao kiểm tra một test có thật sự bảo vệ hành vi bạn cần, thay vì chỉ pass?
- Nêu một việc mà test không chặn được, và bạn dùng gì thay thế.

## Chủ đề liên quan và nguồn kiểm chứng
