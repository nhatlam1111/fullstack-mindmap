# Lab thử nghiệm

Mỗi thư mục trong `experiments/<topic-id>/` là một thử nghiệm chạy thật cho một chủ đề:

- `run.mjs` — script mở các phiên database và in từng câu lệnh cùng kết quả.
- `output.txt` — output nguyên văn của lần chạy được ghi trong README.
- `README.md` — câu hỏi, môi trường, lệnh chạy lại, kết luận và giới hạn của kết luận.

Bài học trong mindmap trỏ tới thử nghiệm bằng trường `examples` với `kind: lab-run` và `path: lab/experiments/<topic-id>`.

## Chạy trên máy bạn

```bash
cd lab
docker compose up -d            # PostgreSQL 16
docker compose --profile oracle up -d   # thêm Oracle Database Free khi cần
npm install
node experiments/db-isolation-levels/run.mjs
```

Kết nối mặc định: `localhost:5432`, user `lab`, mật khẩu `lab`, database `lab`. Đổi bằng biến môi trường `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.

## Quy tắc

- Chỉ ghi kết quả thật vào README; chạy lại thì thay cả output và kết luận.
- Ghi rõ phiên bản database và nơi chạy.
- Kết luận chỉ nói điều output cho thấy; điều gì không đo được thì ghi ở mục giới hạn.
