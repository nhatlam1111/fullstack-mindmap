# Hướng dẫn cho Claude — Mindmap Fullstack

Source của Lam nằm ở `D:\lam.nguyen\Projects\MindMap` trên máy Windows của Lam (thư mục kết nối qua app Claude desktop). Không có Git remote, không có Vercel.
App publish thành artifact private: https://claude.ai/artifact/4TNPENW2kRQLTwQ38LPK7Y (capabilities: db, user, downloads).

## Quy trình release

1. Đóng gói source trên máy Lam bằng shell của thiết bị (bỏ `node_modules`, `dist`, `src/generated`, `.sync`) thành `.sync/source.tar.gz`, stage file đó vào môi trường build và giải nén.
2. `npm ci && (cd lab && npm ci)` rồi `npm run release`. Trên môi trường build mới, lab cần PostgreSQL 16 có role `lab` (superuser, mật khẩu `lab`) và database `lab` thuộc role đó. Bước nào lỗi thì dừng, báo Lam, không publish.
3. Publish `dist/artifact.html` vào đúng URL trên (đọc artifact trước nếu là phiên mới). Không truyền `capabilities` để giữ nguyên khai báo.
4. Sau publish: đọc thử `data/users/me` bằng ArtifactData để chắc dữ liệu học vẫn còn.
5. Ghi một dòng vào `releases.md`, chép `content/ids.lock` (build có thể ghi thêm id) và `dist/artifact.html`, `dist/release.json` vào `releases/last-good/` trên máy Lam.
6. Chép source ngược về máy Lam: đóng gói thành file có tên theo thời gian, ví dụ `.sync/source-YYYYMMDDHHMMSS.tar.gz` (công cụ chép có thể gửi lại bản cũ nếu dùng lại cùng tên), commit file đó, rồi giải nén bằng shell thiết bị với `tar -xzf .sync/<file> --overwrite --no-same-owner --no-same-permissions` (thư mục không cho xóa file nên phải ghi đè tại chỗ). So md5 của hai bên để chắc khớp.

## Quy tắc nội dung (bắt buộc)

- Từ 15/10/2026 Lam giao Claude hoàn thiện và kiểm chứng bài. Claude chỉ đặt `contentStatus: verified` kèm `verifiedBy: claude` khi bài đã qua đủ checklist kiểm chứng (mục 6 của plan) và vòng phản biện độc lập gần nhất không còn phát hiện mức blocker hay major chưa xử lý. Bài Lam tự kiểm chứng dùng `verifiedBy: lam`. Việc học vẫn do Lam: nút "Đã hiểu" đòi tự trả lời câu hỏi, làm thử nghiệm và ghi chú bằng lời của mình.
- Mọi nhận định quan trọng có nguồn đã mở đọc (không dùng snippet tìm kiếm), gắn `[^id]`. Hành vi sản phẩm luôn kèm tên và phiên bản.
- **Ví dụ chỉ từ thực tế**: case công khai do chính tổ chức công bố, tài liệu chính thức, thử nghiệm chạy thật trong `lab/experiments/<id>/` (README ghi môi trường, lệnh, output nguyên văn), hoặc số đo thật từ bài thực hành. Không tự nghĩ kịch bản, công ty, log, số liệu, kể cả khi gắn nhãn minh họa. Không có thì ghi "Chưa có ví dụ thực tế".
- Không đổi id chủ đề; đổi thì thêm id cũ vào `previousIds` của chủ đề mới (hoặc `content/deleted-ids.yaml` nếu xóa).

## Rà soát hằng tuần

`npm run report` in danh sách link nguồn và bài quá hạn rà soát. Kiểm tra từng link bằng WebFetch, báo Lam link chết và bài quá hạn.
