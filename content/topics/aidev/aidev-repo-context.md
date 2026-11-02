---
id: aidev-repo-context
title: Context cho agent trong repo
parent: aidev-specs
summary: File hướng dẫn repo, tài liệu và lệnh build, test mà agent cần biết.
contentStatus: draft
volatility: fast
prerequisites:
  - aidev-writing-specs
related:
  - ai-context-engineering
  - aidev-tests-as-guardrails
sources:
  - id: cc-memory
    url: https://code.claude.com/docs/en/memory
    title: "Claude Code Docs — How Claude remembers your project"
    supports: "Mỗi session Claude Code bắt đầu với context window mới. CLAUDE.md là chỉ dẫn bạn viết, nạp vào đầu mỗi session; có thể đặt ở cấp project, user, tổ chức. File ở thư mục cha của thư mục làm việc nạp lúc khởi động, file ở thư mục con nạp khi cần. Claude coi chúng là context, không phải cấu hình bắt buộc. Nên giữ mỗi file dưới 200 dòng vì file dài tốn context và giảm mức tuân thủ; chỉ dẫn mâu thuẫn thì Claude có thể chọn tùy ý. Claude Code cũng đọc được AGENTS.md của repo."
    product: Claude Code
    version: "tài liệu bản hiện hành, máy Lam chạy 2.1.201"
    checkedAt: 2026-11-02
  - id: cc-best
    url: https://code.claude.com/docs/en/best-practices
    title: "Claude Code Docs — Best practices"
    supports: "Claude bắt đầu mỗi việc bằng cách đọc code và tìm được cấu trúc, quy ước, framework test; thứ nó không tìm được là thông tin không có trong repo. Phép thử trước khi ghi: nó có tìm được bằng cách đọc code không, và nó có thật sự đi tìm không; cả hai có thì bỏ. CLAUDE.md nên giữ ngắn: lệnh test, typecheck, lint chính xác và cách chạy một file test; chỗ code gây hiểu nhầm; quyết định không nằm trong repo; điều đã phải sửa hai lần. Prompt, CLAUDE.md, skill là chỉ dẫn không tất định; hook, deny rule, managed setting là tất định. Dòng bị bỏ qua thường vì file quá dài hoặc dòng đó là quy tắc không có ngoại lệ, khi đó nên dùng hook."
    product: Claude Code
    version: "tài liệu bản hiện hành, máy Lam chạy 2.1.201"
    checkedAt: 2026-11-02
  - id: agents-md
    url: https://agents.md/
    title: "AGENTS.md — A simple, open format for guiding coding agents"
    supports: "AGENTS.md là định dạng mở, Markdown thuần, không có trường bắt buộc, do Agentic AI Foundation thuộc Linux Foundation quản lý. Nên có tổng quan dự án, lệnh build và test, quy ước code, hướng dẫn test, lưu ý bảo mật. Là bạn đồng hành của README: README cho người, AGENTS.md chứa chi tiết dành cho agent. Trong monorepo, đặt file trong từng project con, agent đọc file gần nhất; prompt của người dùng ghi đè tất cả. Repo chính của OpenAI có 88 file như vậy. Nhiều công cụ hỗ trợ, gồm Codex, Cursor, Gemini CLI, Aider, GitHub Copilot coding agent; Aider và Gemini CLI cần cấu hình."
    product: AGENTS.md
    checkedAt: 2026-11-02
  - id: this-repo-claude
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/CLAUDE.md
    title: "fullstack-mindmap — CLAUDE.md"
    supports: "File hướng dẫn của chính repo này: nơi đặt source, URL artifact, sáu bước release, quy tắc nội dung bắt buộc, việc rà soát hằng tuần."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-11-02
examples:
  - id: this-repo-instructions
    kind: official-doc
    title: "CLAUDE.md của chính repo này: quy trình release và quy tắc nội dung không suy ra được từ code"
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/CLAUDE.md
    checkedAt: 2026-11-02
changelog:
  - date: 2026-11-02
    note: "Claude soạn bài từ tài liệu Claude Code, trang AGENTS.md và CLAUDE.md của repo này."
---

## Vấn đề cần giải quyết

Mỗi session của coding agent bắt đầu từ đầu: với Claude Code, mỗi session có một context window mới[^cc-memory]. Agent đọc được code, nhưng không biết những điều chưa bao giờ nằm trong repo: quy trình deploy trong đầu một người, quyết định của buổi họp, biến môi trường mà test tích hợp cần[^cc-best].

Thiếu những thứ đó, agent làm đúng về mặt code nhưng sai với dự án, hoặc phải tìm lại cùng một dữ kiện ở mỗi session. File hướng dẫn trong repo là cách đưa các thông tin ấy vào đầu mỗi session, để không phải nhắc lại.

## Cơ chế và luồng hoạt động

**Hai dạng file phổ biến.**

- **`CLAUDE.md`** của Claude Code: chỉ dẫn bạn viết, nạp vào đầu mỗi session. File có thể ở cấp project, cấp user hoặc cấp tổ chức. File ở các thư mục cha của thư mục làm việc được nạp lúc khởi động, còn file ở thư mục con được nạp khi cần[^cc-memory].
- **`AGENTS.md`:** định dạng mở, Markdown thuần, không có trường bắt buộc. Trong monorepo, đặt một file trong từng project con; agent đọc file gần nhất. Trang AGENTS.md liệt kê nhiều công cụ hỗ trợ, trong đó Aider và Gemini CLI cần cấu hình thêm[^agents-md]. Claude Code cũng đọc được `AGENTS.md`[^cc-memory].

`AGENTS.md` không thay README: README dành cho người, còn file này chứa chi tiết dành cho agent[^agents-md].

**Nên ghi gì.** Phép thử của tài liệu Claude Code có hai câu: agent có tìm được điều này bằng cách đọc code không, và nó có thật sự đi tìm không. Cả hai đều có thì bỏ[^cc-best]. Những gì nên giữ lại[^cc-best]:

- lệnh test, typecheck, lint chính xác, và cách chạy một file test;
- chỗ code gây hiểu nhầm, ví dụ một mẫu cũ có khắp nơi nhưng code mới không được chép theo;
- quyết định không có trong repo, ví dụ cách deploy, việc gì cần review migration;
- điều bạn đã phải sửa hai lần.

Trang AGENTS.md gợi ý thêm tổng quan dự án, quy ước code, hướng dẫn test và lưu ý bảo mật[^agents-md].

**File hướng dẫn là context, không phải luật.** Tài liệu Claude Code ghi rõ Claude coi các file này là context, không phải cấu hình bắt buộc[^cc-memory]. Chỉ dẫn chia làm hai loại[^cc-best]:

| Loại | Gồm | Bảo đảm |
|---|---|---|
| Không tất định | prompt, `CLAUDE.md`, skill | model đọc rồi tự quyết định |
| Tất định | hook, deny rule, managed setting | công cụ luôn áp dụng |

Quy tắc không có ngoại lệ thì đặt ở loại thứ hai. Các kiểm tra chạy thật được bàn ở bài Test làm lưới an toàn.

**Giữ file ngắn.** Mỗi dòng tốn một phần sự chú ý ở mọi việc, dù có liên quan hay không[^cc-best]. Claude Code khuyên giữ mỗi file dưới 200 dòng, vì file dài tốn context và giảm mức tuân thủ[^cc-memory].

## Điều kiện áp dụng, lợi ích và đánh đổi

**Lợi ích.** Agent không phải tìm lại cùng một dữ kiện. File nằm trong repo nên được review và có lịch sử như code.

**Đánh đổi.**

- **Mỗi dòng có giá.** File dài làm giảm mức tuân thủ[^cc-memory]. Viết càng nhiều không có nghĩa là agent làm theo càng nhiều.
- **File có thể cũ.** Hai chỉ dẫn mâu thuẫn thì Claude có thể chọn tùy ý[^cc-memory], nên cần rà soát định kỳ như mọi tài liệu khác.
- **Không phải nơi cho mọi thứ.** Cấu trúc thư mục, quy ước đọc được từ code thì agent đã tự tìm được[^cc-best].

**Khi nào không cần.** Dự án nhỏ mà agent tự tìm được hết bằng cách đọc code. Tài liệu Claude Code mô tả rằng thường prompt đầu tiên trong session mới đã làm đúng, và phần thiết lập chỉ cần khi dự án có kiến thức, quy tắc hay ràng buộc không thấy được từ code[^cc-best].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Chép cấu trúc thư mục và quy ước vào file hướng dẫn.** Dấu hiệu: file dài ra mà nội dung agent tự tìm được. Áp dụng phép thử hai câu ở trên[^cc-best].
- **Thêm chữ IMPORTANT khi agent bỏ qua một dòng.** Tài liệu cho biết cách này thường không có tác dụng: hoặc file quá dài nên dòng đó bị lạc, hoặc đó là quy tắc không có ngoại lệ và nên chuyển thành hook[^cc-best]. Dấu hiệu: cùng một dòng được nhấn mạnh ngày càng nhiều mà vẫn bị bỏ qua.
- **Viết quy tắc bảo mật chỉ trong file hướng dẫn.** Dấu hiệu: quy tắc "không đọc file X" chỉ nằm trong `CLAUDE.md`. File này không phải cấu hình bắt buộc[^cc-memory]; dùng deny rule hoặc hook.
- **Để chỉ dẫn mâu thuẫn.** Dấu hiệu: agent lúc làm theo cách này, lúc làm theo cách kia[^cc-memory].
- **Ghi lệnh test không chạy được.** Dấu hiệu: agent báo lỗi môi trường ở bước đầu tiên, hoặc tự đoán lệnh khác. Lệnh trong file phải là lệnh chạy được thật.

## Ví dụ thực tế

- [ex:this-repo-instructions] — `CLAUDE.md` của chính repo này[^this-repo-claude] ghi những điều không suy ra được từ code:
    - URL artifact và quy tắc không truyền `capabilities` khi publish;
    - sáu bước release, gồm bước đọc lại `data/users/me` để chắc dữ liệu học còn nguyên;
    - quy tắc nội dung: chỉ đặt `verified` sau checklist và phản biện độc lập, ví dụ chỉ từ thực tế.
    - Nó không mô tả cấu trúc thư mục; phần đó nằm trong `README.md`.

Trang AGENTS.md cũng ghi rằng repo chính của OpenAI có 88 file `AGENTS.md`, cho thấy cách chia theo project con ở quy mô lớn[^agents-md].

## Câu hỏi tự kiểm tra

- Với dự án bạn đang làm, nêu ba điều agent không thể tự tìm được từ code, và hai điều nên bỏ ra khỏi file hướng dẫn. Dựa vào phép thử nào?
- Agent cứ bỏ qua dòng "không sửa thư mục `generated/`" trong `CLAUDE.md`. Vì sao thêm IMPORTANT thường không giải quyết được, và bạn nên làm gì?
- `AGENTS.md` và README khác nhau thế nào về người đọc? Trong monorepo, agent đọc file nào?
- Vì sao một file hướng dẫn 800 dòng có thể cho kết quả kém hơn file 100 dòng?

## Chủ đề liên quan và nguồn kiểm chứng
