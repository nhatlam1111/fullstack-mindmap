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
    supports: "Mỗi session Claude Code bắt đầu với context window mới. CLAUDE.md là chỉ dẫn bạn viết, nạp vào đầu mỗi session; có thể đặt ở cấp project, user, tổ chức. File ở thư mục cha của thư mục làm việc nạp lúc khởi động, file ở thư mục con nạp khi cần. Claude coi chúng là context, không phải cấu hình bắt buộc. Nên giữ mỗi file dưới 200 dòng vì file dài tốn context và giảm mức tuân thủ; chỉ dẫn mâu thuẫn thì Claude có thể chọn tùy ý. Từ bản 2.1.277, Claude Code đọc AGENTS.md của repo; khi thư mục làm việc hoặc thư mục cha có CLAUDE.md hay CLAUDE.local.md thì mặc định chỉ đọc các file CLAUDE.md, muốn dùng chung thì thêm @AGENTS.md vào CLAUDE.md. Hai cơ chế mang kiến thức qua các session: CLAUDE.md và auto memory; auto memory do Claude tự ghi, bật mặc định ở session cục bộ, nằm riêng trên từng máy. Quy trình nhiều bước hoặc chỉ áp cho một phần codebase nên chuyển sang skill hoặc path-scoped rule. CLAUDE.md import được file khác bằng cú pháp @đường-dẫn; import giúp sắp xếp file dài nhưng không giảm context, vì file được import nạp cùng CLAUDE.md. Trang này cũng liệt kê build commands, conventions, project layout là thứ nên ghi."
    product: Claude Code
    version: "tài liệu đọc 02/11/2026, khi bản mới nhất là 2.1.316"
    checkedAt: 2026-11-02
  - id: cc-best
    url: https://code.claude.com/docs/en/best-practices
    title: "Claude Code Docs — Best practices for Claude Code"
    supports: "Claude bắt đầu mỗi việc bằng cách đọc code và tìm được cấu trúc, quy ước, framework test; thứ nó không tìm được là thông tin không có trong repo. Phép thử trước khi ghi: nó có tìm được bằng cách đọc code không, và nó có thật sự đi tìm không; cả hai có thì bỏ. CLAUDE.md nên giữ ngắn: lệnh test, typecheck, lint chính xác và cách chạy một file test; chỗ code gây hiểu nhầm; quyết định không nằm trong repo; điều đã phải sửa hai lần. Prompt, CLAUDE.md, skill là chỉ dẫn không tất định; hook, deny rule, managed setting là tất định. Dòng bị bỏ qua thường vì file quá dài hoặc dòng đó là quy tắc không có ngoại lệ, khi đó nên dùng hook. Prompt hook và agent hook hỏi một model khác nên cũng không tất định; chỉ command hook và http hook mới tất định. Rule khớp lời gọi công cụ chứ không khớp ý định: deny rule đọc file không chặn được một script tự mở file đó; việc liên quan bảo mật nên có cả deny rule lẫn sandbox. Quy trình release dài nên đặt trong skill vì skill chỉ được đọc đủ khi cần. Bảng lời khuyên cũ xếp việc mô tả kiến trúc và file layout trong CLAUDE.md vào loại không còn cần."
    product: Claude Code
    version: "tài liệu đọc 02/11/2026, khi bản mới nhất là 2.1.316"
    checkedAt: 2026-11-02
  - id: agents-md
    url: https://agents.md/
    title: "AGENTS.md — A simple, open format for guiding coding agents"
    supports: "AGENTS.md là định dạng mở, Markdown thuần, không có trường bắt buộc, do Agentic AI Foundation thuộc Linux Foundation quản lý. Nên có tổng quan dự án, lệnh build và test, quy ước code, hướng dẫn test, lưu ý bảo mật. Là bạn đồng hành của README: README cho người, AGENTS.md chứa chi tiết dành cho agent. Trong monorepo, đặt file trong từng project con, agent đọc file gần nhất; prompt của người dùng ghi đè tất cả. Tại thời điểm trang viết, repo chính của OpenAI có 88 file như vậy. Nhiều công cụ hỗ trợ, gồm Codex, Cursor, Gemini CLI, Aider, GitHub Copilot coding agent; Aider và Gemini CLI cần cấu hình."
    product: AGENTS.md
    version: "trang hiện hành, đọc 02/11/2026"
    checkedAt: 2026-11-02
  - id: this-repo-claude
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/CLAUDE.md
    title: "fullstack-mindmap — CLAUDE.md"
    supports: "File hướng dẫn của chính repo này: nơi đặt source, URL artifact, sáu bước release, quy tắc nội dung bắt buộc, việc rà soát hằng tuần."
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
  - id: agents-md-openai
    kind: official-doc
    title: "Trang AGENTS.md: repo chính của OpenAI có 88 file AGENTS.md"
    url: https://agents.md/
    checkedAt: 2026-11-02
  - id: this-repo-instructions
    kind: official-doc
    title: "CLAUDE.md của chính repo này: quy trình release và quy tắc nội dung không suy ra được từ code"
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/CLAUDE.md
    checkedAt: 2026-11-02
changelog:
  - date: 2026-11-02
    note: "Claude soạn bài từ tài liệu Claude Code, trang AGENTS.md và CLAUDE.md của repo này."
  - date: 2026-11-02
    note: "Phản biện vòng 1: sửa cách Claude Code đọc AGENTS.md theo phiên bản và điều kiện của nguồn; thêm auto memory, skill, path-scoped rule, import; giới hạn của deny rule và sandbox; ghi ngày đọc tài liệu; nêu chỗ hai trang tài liệu khác nhau; khai báo ví dụ của trang AGENTS.md."
  - date: 2026-11-02
    note: "Phản biện vòng 2: tách import khỏi các cách làm file ngắn, vì import không giảm context; ghi bản Claude Code mới nhất ở ngày đọc, thêm nguồn changelog."
---

## Vấn đề cần giải quyết

Với Claude Code, mỗi session bắt đầu với một context window mới, tức phần thông tin model đang giữ trong phiên đó. Hai cơ chế mang kiến thức qua các session là file hướng dẫn do bạn viết và auto memory do Claude tự ghi. Auto memory bật mặc định ở session cục bộ, nhưng nằm riêng trên từng máy, không đi theo repo[^cc-memory]. Vì vậy kiến thức chung của nhóm vẫn phải nằm trong file hướng dẫn.

Agent đọc được code, nhưng không biết những điều chưa bao giờ nằm trong repo: quy trình deploy trong đầu một người, quyết định của buổi họp, biến môi trường mà test tích hợp cần[^cc-best].

Thiếu những thứ đó, agent có thể làm khác điều bạn muốn, hoặc phải tìm lại cùng một dữ kiện ở mỗi session[^cc-best]. File hướng dẫn trong repo là cách đưa các thông tin ấy vào đầu mỗi session, để không phải nhắc lại.

## Cơ chế và luồng hoạt động

Các hành vi của Claude Code trong bài theo tài liệu đọc ngày 02/11/2026, khi bản mới nhất là 2.1.316[^cc-changelog]; công cụ này đổi nhanh, nên kiểm lại trên phiên bản bạn dùng.

**Hai dạng file phổ biến.**

- **`CLAUDE.md`** của Claude Code: chỉ dẫn bạn viết, nạp vào đầu mỗi session. File có thể ở cấp project, cấp user hoặc cấp tổ chức. File ở các thư mục cha của thư mục làm việc được nạp lúc khởi động, còn file ở thư mục con được nạp khi cần[^cc-memory].
- **`AGENTS.md`:** định dạng mở, Markdown thuần, không có trường bắt buộc. Trang AGENTS.md khuyên, trong monorepo, đặt một file trong từng project con, và quy ước là agent đọc file gần nhất. Trang này liệt kê nhiều công cụ hỗ trợ, trong đó Aider và Gemini CLI cần cấu hình thêm[^agents-md].

Từ bản 2.1.277, Claude Code đọc `AGENTS.md`, nhưng theo cách riêng: nếu thư mục làm việc hoặc thư mục cha có `CLAUDE.md` hay `CLAUDE.local.md`, mặc định nó chỉ đọc các file `CLAUDE.md`. Muốn dùng chung một nội dung, thêm dòng `@AGENTS.md` vào `CLAUDE.md`[^cc-memory].

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
| Tất định | `command` hook, `http` hook, deny rule, managed setting | công cụ luôn áp dụng |

Hook là script chạy ở các điểm cố định trong vòng làm việc của agent, deny rule là luật chặn một lời gọi công cụ, và skill là quy trình lưu riêng. `prompt` hook và `agent` hook hỏi một model khác, nên không tất định[^cc-best]. Quy tắc không có ngoại lệ thì đặt ở loại thứ hai[^cc-best]. Các kiểm tra chạy thật được bàn ở bài Test làm lưới an toàn.

**Giữ file ngắn.** Mỗi dòng tốn một phần sự chú ý ở mọi việc, dù có liên quan hay không[^cc-best]. Claude Code khuyên giữ mỗi file dưới 200 dòng, vì file dài tốn context và giảm mức tuân thủ[^cc-memory]. Có hai cách để file ngắn lại:

- Quy trình nhiều bước, như release, chuyển sang skill: Claude chỉ đọc đủ file đó khi việc cần tới[^cc-best][^cc-memory].
- Chỉ dẫn chỉ áp cho một phần codebase chuyển sang path-scoped rule: nó chỉ nạp khi làm với file khớp[^cc-memory].

Import bằng cú pháp `@đường-dẫn` giúp sắp xếp file dài, nhưng không giảm context, vì file được import nạp cùng `CLAUDE.md`[^cc-memory].

## Điều kiện áp dụng, lợi ích và đánh đổi

**Lợi ích.** Agent không phải tìm lại cùng một dữ kiện. File nằm trong repo nên được review và có lịch sử như code.

**Đánh đổi.**

- **Mỗi dòng có giá.** File dài làm giảm mức tuân thủ[^cc-memory]. Viết càng nhiều không có nghĩa là agent làm theo càng nhiều.
- **File có thể cũ.** Hai chỉ dẫn mâu thuẫn thì Claude có thể chọn tùy ý[^cc-memory], nên cần rà soát định kỳ như mọi tài liệu khác.
- **Không phải nơi cho mọi thứ.** Cấu trúc thư mục, quy ước đọc được từ code thì agent đã tự tìm được[^cc-best].

**Khi nào không cần.** Tài liệu Claude Code mô tả rằng trong đa số trường hợp, prompt đầu tiên trong session mới đã làm đúng, và phần thiết lập thường cần khi dự án có kiến thức, quy tắc hay ràng buộc không thấy được từ code[^cc-best]. Bài này suy ra: dự án nhỏ, chưa có những thứ đó, thì chưa cần file hướng dẫn.

## Lỗi thường gặp và dấu hiệu nhận biết

- **Chép cấu trúc thư mục và các quy ước đọc được từ code vào file hướng dẫn.** Dấu hiệu: file dài ra mà nội dung agent tự tìm được. Áp dụng phép thử hai câu ở trên[^cc-best]. Hai trang tài liệu của Claude Code không hoàn toàn thống nhất: trang bộ nhớ liệt kê project layout là thứ nên ghi[^cc-memory], còn trang best practices xếp việc mô tả file layout vào lời khuyên cũ[^cc-best]. Bài này theo trang best practices. Quy ước không suy ra được từ code thì vẫn nên ghi.
- **Thêm chữ IMPORTANT khi agent bỏ qua một dòng.** Tài liệu cho biết cách này thường không có tác dụng: hoặc file quá dài nên dòng đó bị lạc, hoặc đó là quy tắc không có ngoại lệ và nên chuyển thành hook[^cc-best]. Dấu hiệu: cùng một dòng được nhấn mạnh ngày càng nhiều mà vẫn bị bỏ qua.
- **Viết quy tắc bảo mật chỉ trong file hướng dẫn.** Dấu hiệu: quy tắc "không đọc file X" chỉ nằm trong `CLAUDE.md`. File này không phải cấu hình bắt buộc[^cc-memory]. Deny rule mạnh hơn, nhưng rule khớp lời gọi công cụ chứ không khớp ý định: nó không chặn được một script tự mở file đó. Việc liên quan bảo mật nên có cả deny rule lẫn sandbox[^cc-best].
- **Để chỉ dẫn mâu thuẫn.** Dấu hiệu: agent lúc làm theo cách này, lúc làm theo cách kia[^cc-memory].
- **Ghi lệnh test không chạy được** (kinh nghiệm bài này nêu). Dấu hiệu: agent báo lỗi môi trường ở bước đầu tiên, hoặc tự đoán lệnh khác. Lệnh trong file phải là lệnh chạy được thật.

## Ví dụ thực tế

- [ex:this-repo-instructions] — `CLAUDE.md` của chính repo này[^this-repo-claude] ghi những điều không suy ra được từ code:
    - URL artifact và quy tắc không truyền `capabilities` khi publish;
    - sáu bước release, gồm bước đọc lại `data/users/me` để chắc dữ liệu học còn nguyên;
    - quy tắc nội dung: chỉ đặt `verified` sau checklist và phản biện độc lập, ví dụ chỉ từ thực tế.

  File này không mô tả cấu trúc thư mục; phần đó nằm trong `README.md`. Theo tài liệu, quy trình nhiều bước như release nên chuyển sang skill[^cc-best]; file này chưa làm vậy.
- [ex:agents-md-openai] — trang AGENTS.md ghi rằng, tại thời điểm trang viết, repo chính của OpenAI có 88 file `AGENTS.md`, một ví dụ của cách chia theo project con ở quy mô lớn[^agents-md].

## Câu hỏi tự kiểm tra

- Với dự án bạn đang làm, nêu ba điều agent không thể tự tìm được từ code, và hai điều nên bỏ ra khỏi file hướng dẫn. Dựa vào phép thử nào?
- Agent cứ bỏ qua dòng "không sửa thư mục `generated/`" trong `CLAUDE.md`. Vì sao thêm IMPORTANT thường không giải quyết được, và bạn nên làm gì?
- `AGENTS.md` và README khác nhau thế nào về người đọc? Repo của bạn có cả `CLAUDE.md` lẫn `AGENTS.md`: theo tài liệu đọc ngày 02/11/2026, Claude Code đọc file nào, và làm sao để dùng chung nội dung?
- Vì sao một file hướng dẫn 800 dòng có thể cho kết quả kém hơn file 100 dòng?

## Chủ đề liên quan và nguồn kiểm chứng
