# Mindmap Fullstack

Mindmap để học, tra cứu, ghi chú và theo dõi mức hiểu kiến thức fullstack, học theo từng chặng.
App chạy ở hai nơi:

- **claude.ai:** https://claude.ai/artifact/4TNPENW2kRQLTwQ38LPK7Y (private, chỉ tài khoản của bạn mở được). Dữ liệu học lưu trong kho dữ liệu của artifact, theo tài khoản.
- **GitHub Pages:** https://nhatlam1111.github.io/fullstack-mindmap/ (công khai, tự build và deploy mỗi lần push lên `main`, xem `.github/workflows/pages.yml`). Dữ liệu học lưu trong `localStorage` của trình duyệt, riêng từng trình duyệt và từng thiết bị. Muốn chuyển dữ liệu từ nơi này sang nơi kia: mở "Dữ liệu học", xuất file sao lưu `.json` rồi nhập vào nơi còn lại.

## Thư mục

| Đường dẫn | Nội dung |
| --- | --- |
| `content/branches.yaml` | 8 nhánh và các nhóm |
| `content/roadmap.yaml` | Các chặng của lộ trình: mục tiêu, bài thực hành, mốc kiểm tra, chủ đề |
| `content/topics/<nhánh>/<id>.md` | Một chủ đề một file: frontmatter + 7 mục của bài |
| `content/ids.lock` | Mọi id từng có; build tự ghi thêm, không xóa dòng |
| `lab/` | Thử nghiệm chạy thật (`docker-compose.yml`, `experiments/<id>/`) |
| `scripts/` | Kiểm tra nội dung, biên dịch, release, báo cáo rà soát |
| `src/` | Ứng dụng React |
| `tests/` | Unit test (Vitest) và end-to-end (Playwright) |
| `releases.md` | Nhật ký publish |
| `releases/last-good/` | Bản build gần nhất đã qua mọi bước kiểm tra, dùng để quay lui |

## Viết hoặc sửa một bài

1. Mở `content/topics/<nhánh>/<id>.md`, đổi `contentStatus` từ `skeleton` sang `draft`.
2. Viết đủ 7 mục theo đúng thứ tự: Vấn đề cần giải quyết · Cơ chế và luồng hoạt động · Điều kiện áp dụng, lợi ích và đánh đổi · Lỗi thường gặp và dấu hiệu nhận biết · Ví dụ thực tế · Câu hỏi tự kiểm tra · Chủ đề liên quan và nguồn kiểm chứng. Mục `## Đào sâu` (tùy chọn) đặt cuối.
3. Mỗi nhận định quan trọng gắn chú thích `[^id-nguon]` khớp một nguồn trong `sources`.
4. **Ví dụ chỉ lấy từ thực tế.** Khai báo trong `examples` với `kind` là `public-case`, `official-doc` (cần `url`) hoặc `lab-run`, `practice-measurement` (cần `path` tới thư mục có README). Mục Ví dụ thực tế tham chiếu bằng `[ex:id]`, hoặc ghi "Chưa có ví dụ thực tế". Không tự nghĩ kịch bản, log hay số liệu.
5. Sau khi chạy checklist kiểm chứng và qua vòng phản biện độc lập, đặt `contentStatus: verified`, `verifiedAt` và `verifiedBy` (`lam` hoặc `claude`). App hiện rõ ai đã kiểm chứng bài.
6. Nhờ Claude release và publish (xem `CLAUDE.md`).

## Lệnh

```bash
npm ci
npm run validate   # kiểm tra nội dung
npm run release    # typecheck, lint, validate, unit test, build, e2e; xanh hết mới có dist/artifact.html
npm run report     # link nguồn cần kiểm tra và bài quá hạn rà soát
```

Thư mục `.sync/` chỉ dùng để chuyển file giữa máy bạn và môi trường build của Claude; có thể bỏ qua.
