---
id: learn-lab
title: Lab thử nghiệm
parent: learn-practice
summary: Môi trường cố định để chạy thử nghiệm và ghi lại kết quả thật.
contentStatus: draft
volatility: stable
prerequisites: []
related:
  - learn-practice-case
  - learn-using-mindmap
  - learn-six-questions
sources:
  - id: lab-readme
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/lab/README.md
    title: "fullstack-mindmap — lab/README.md"
    supports: "Mỗi thư mục experiments/<topic-id>/ là một thử nghiệm chạy thật gồm run.mjs, output.txt (output nguyên văn của lần chạy ghi trong README) và README.md (câu hỏi, môi trường, lệnh chạy lại, kết luận, giới hạn). Bài học trỏ tới thử nghiệm bằng examples với kind lab-run và path lab/experiments/<topic-id>. Kết nối mặc định localhost:5433, user lab, mật khẩu lab, database lab, đổi bằng PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE; lab cố ý không dùng 5432 để không chạy nhầm vào PostgreSQL có sẵn trên máy. Quy tắc: chỉ ghi kết quả thật, chạy lại thì thay cả output và kết luận; ghi rõ phiên bản database và nơi chạy; kết luận chỉ nói điều output cho thấy, điều không đo được ghi ở mục giới hạn."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: lab-compose
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/lab/docker-compose.yml
    title: "fullstack-mindmap — lab/docker-compose.yml"
    supports: "Service postgres dùng image postgres:16 với POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB là lab, cổng 127.0.0.1:${LAB_PG_PORT:-5433}:5432, dữ liệu trong volume pgdata. Service oracle dùng image gvenzl/oracle-free:23.26.1-slim, cổng 127.0.0.1:1521, chỉ chạy khi bật profile oracle."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: lab-harness
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/lab/lib/harness.mjs
    title: "fullstack-mindmap — lab/lib/harness.mjs"
    supports: "Bộ chạy thử nghiệm mở nhiều phiên PostgreSQL bằng driver pg, in từng câu lệnh kèm tên phiên, số mili giây tính từ lúc script chạy và kết quả; lỗi được in ra (mã lỗi, thông báo, DETAIL) thay vì ném. header() in phiên bản máy chủ (dòng Máy chủ:), isolation mặc định, phiên bản Node.js và driver pg, thời điểm chạy. Cổng mặc định 5433, đổi bằng PGPORT."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: lab-claude
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/CLAUDE.md
    title: "fullstack-mindmap — CLAUDE.md (quy tắc nội dung)"
    supports: "Ví dụ chỉ từ thực tế: case công khai do chính tổ chức công bố, tài liệu chính thức, thử nghiệm chạy thật trong lab/experiments/<id>/ (README ghi môi trường, lệnh, output nguyên văn), hoặc số đo thật từ bài thực hành. Không tự nghĩ kịch bản, công ty, log, số liệu. Không có thì ghi Chưa có ví dụ thực tế."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: lab-kinds
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/scripts/lib/schema.ts
    title: "fullstack-mindmap — scripts/lib/schema.ts (loại ví dụ)"
    supports: "Năm loại ví dụ: public-case, official-doc, research (nghiên cứu gốc do chính nhóm tác giả công bố), lab-run, practice-measurement. public-case, official-doc, research cần url; lab-run, practice-measurement cần path tới thư mục thử nghiệm."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: compose-services
    url: https://docs.docker.com/reference/compose-file/services/
    title: "Docker Docs — Compose file reference: services (bản hiện hành, đọc 29/10/2026)"
    supports: "Tài liệu bản hiện hành; máy của Lam dùng Docker Compose v5.5.1 (lệnh docker compose version, 29/10/2026). Cú pháp ngắn của ports là [HOST:]CONTAINER[/PROTOCOL]; nếu không ghi host IP, Docker gắn vào mọi giao diện (0.0.0.0), bỏ qua luật tường lửa của máy và có thể lộ container ra internet nếu máy có IP công khai. Service có profiles chỉ chạy khi profile đó được bật; service không có profiles luôn chạy. image nhận tag hoặc digest."
    product: Docker Compose
    checkedAt: 2026-10-29
  - id: compose-interpolation
    url: https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/
    title: "Docker Docs — Compose: variable interpolation (bản hiện hành, đọc 29/10/2026)"
    supports: "${VAR:-default} lấy giá trị VAR nếu đã đặt và không rỗng, nếu không thì lấy default; ${VAR-default} chỉ dùng default khi VAR chưa đặt. Thứ tự ưu tiên: biến môi trường của shell, rồi file --env-file, rồi file .env trong thư mục project."
    product: Docker Compose
    checkedAt: 2026-10-29
  - id: postgres-image
    url: https://hub.docker.com/_/postgres
    title: "Docker Hub — postgres (Docker Official Image)"
    supports: "POSTGRES_PASSWORD bắt buộc, POSTGRES_USER tạo superuser và database cùng tên, POSTGRES_DB đặt tên database mặc định. Các biến này chỉ có tác dụng khi container khởi động với thư mục dữ liệu rỗng; database đã có sẵn được giữ nguyên. Ở thời điểm đọc, tag 16 trỏ cùng bản build với 16.15; trang không nêu chính sách tag 16 có theo các bản 16.x sau hay không."
    product: postgres Docker Official Image
    version: "16 (16.15)"
    checkedAt: 2026-10-29
examples:
  - id: lab-mvcc
    kind: lab-run
    title: "Lab MVCC: PostgreSQL 16.15, chạy ngày 15/10/2026"
    path: lab/experiments/db-mvcc
    checkedAt: 2026-10-29
  - id: lab-lsm
    kind: lab-run
    title: "Lab LSM-tree: RocksDB 9.8.4 qua Python, chạy ngày 16/10/2026"
    path: lab/experiments/db-lsm-tree
    checkedAt: 2026-10-29
changelog:
  - date: 2026-10-29
    note: Claude soạn bài từ lab/README.md, docker-compose.yml, harness.mjs, hai lab có thật và tài liệu Docker.
  - date: 2026-10-29
    note: "Phản biện vòng 1: commit cấu hình lab mà bài mô tả; liệt kê đủ năm loại ví dụ; sửa mô tả mốc thời gian của harness, lệnh của lab LSM; ghi rõ chưa có lần chạy nào trong Docker; thêm lỗi quên đặt PGPORT khi dùng PostgreSQL có sẵn; ghi phiên bản Docker Compose."
---

## Vấn đề cần giải quyết

Tài liệu nói một sản phẩm "làm X", nhưng hành vi thật phụ thuộc phiên bản, cấu hình mặc định và cả cách bạn gọi nó. Đọc tài liệu cho bạn một nhận định; chạy thử cho bạn bằng chứng.

Mindmap này chỉ nhận ví dụ từ thực tế: case công khai do chính tổ chức công bố, tài liệu chính thức, nghiên cứu gốc, thử nghiệm chạy thật và số đo thật từ bài thực hành. Không có thì bài ghi "Chưa có ví dụ thực tế"[^lab-claude][^lab-kinds]. Thử nghiệm chạy thật là loại ví dụ người học tự làm lại được. Để kết quả đáng tin và chạy lại được, thử nghiệm cần ba thứ:

- một môi trường cố định, biết chính xác phiên bản;
- output nguyên văn, không sửa tay;
- kết luận chỉ nói điều output cho thấy.

Lab là chỗ chứa các thử nghiệm đó[^lab-readme].

## Cơ chế và luồng hoạt động

**Một thử nghiệm là một thư mục** `lab/experiments/<topic-id>/`, cùng tên với id chủ đề[^lab-readme]:

- `run.mjs`: script mở các phiên database, in từng câu lệnh và kết quả.
- `output.txt`: output nguyên văn của lần chạy được ghi trong README.
- `README.md`: câu hỏi, môi trường, lệnh chạy lại, kết luận và giới hạn của kết luận.

Bài học trỏ tới thử nghiệm bằng một mục trong `examples` với `kind: lab-run` và `path: lab/experiments/<topic-id>`[^lab-readme].

**Môi trường cố định bằng Docker Compose** (`lab/docker-compose.yml`)[^lab-compose]:

- Service `postgres` chạy image `postgres:16`, tạo sẵn user `lab`, mật khẩu `lab`, database `lab`. Dữ liệu nằm trong volume `pgdata`.
- Cổng `127.0.0.1:${LAB_PG_PORT:-5433}:5432`: trong container là 5432, trên máy là 5433, trừ khi bạn đặt `LAB_PG_PORT`. Cú pháp `${VAR:-default}` lấy giá trị biến nếu đã đặt và không rỗng, nếu không thì lấy giá trị mặc định[^compose-interpolation].
- Service `oracle` chỉ chạy khi bật profile `oracle`[^lab-compose]. Service có `profiles` chỉ khởi động khi profile đó được bật[^compose-services].

**Bộ chạy `lab/lib/harness.mjs`** cho các lab PostgreSQL[^lab-harness]:

1. `header()` in phiên bản máy chủ (dòng `Máy chủ:`), mức isolation mặc định, phiên bản Node.js và driver `pg`, thời điểm chạy.
2. `session(name)` mở một kết nối có tên. Mỗi câu lệnh được in kèm tên phiên và số mili giây tính từ lúc script chạy, rồi in kết quả dạng bảng. Thời điểm tuyệt đối chỉ có ở header.
3. Lỗi được in ra (mã lỗi, thông báo, `DETAIL`) thay vì làm dừng script, nên output ghi lại được cả các lần lỗi cố ý.

Không phải lab nào cũng là PostgreSQL. Lab LSM-tree chạy RocksDB qua Python và có `run.py` thay cho `run.mjs`.

**Chạy một lab:**

```bash
cd lab
docker compose up -d postgres
npm install
node experiments/db-mvcc/run.mjs
```

**Quy tắc ghi kết quả**[^lab-readme]:

- Chỉ ghi kết quả thật vào README. Chạy lại thì thay cả output và kết luận.
- Ghi rõ phiên bản database và nơi chạy.
- Kết luận chỉ nói điều output cho thấy. Điều gì không đo được thì ghi ở mục giới hạn.

## Điều kiện áp dụng, lợi ích và đánh đổi

**Lợi ích.**

- Nhận định trong bài được neo vào một lần chạy cụ thể, có phiên bản và output đầy đủ. Người đọc tự chạy lại được bằng đúng lệnh trong README.
- Tiêu chí thứ hai của nút "Đã hiểu" là chạy lại thử nghiệm trong lab hoặc đọc kỹ ví dụ thực tế. Lab là cách trực tiếp nhất để đạt tiêu chí đó.

**Đánh đổi và giới hạn.**

- **Tag `postgres:16` không cố định bản vá.** Ở thời điểm đọc, tag `16` trỏ cùng bản build với `16.15`, nhưng trang image không hứa tag này giữ nguyên[^postgres-image]. Vì vậy README ghi phiên bản đầy đủ lấy từ dòng `Máy chủ:` của lần chạy, không chỉ ghi "16".
- **Nơi chạy khác nhau.** Đến 29/10/2026, mọi lab hiện có đều chạy trong môi trường build Linux của Claude, chưa lab nào chạy trong Docker trên máy bạn, nên chưa có lần chạy nào để so hai nơi. Chạy lại ở bất cứ đâu, các giá trị như `xmin`, `ctid` và số mili giây sẽ khác lần chạy đã ghi; README chỉ ghi kết quả của lần chạy cụ thể đó.
- **Một máy, một lần chạy.** Lab không chứng minh hành vi ở tải lớn, trên nhiều máy, hay trên dịch vụ cloud managed.
- **Không phải chủ đề nào cũng có lab.** Khái niệm kiến trúc, quy trình xử lý sự cố, dịch vụ Azure hay cổng thanh toán không chạy thử được trên máy. Với các chủ đề đó, ví dụ lấy từ các loại còn lại: tài liệu chính thức, case công khai, nghiên cứu, hoặc số đo thật từ bài thực hành; không có thì ghi "Chưa có ví dụ thực tế"[^lab-claude].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Lab chạy nhầm vào một PostgreSQL khác.** Dấu hiệu: dòng `Máy chủ:` không phải PostgreSQL 16, hoặc lỗi xác thực cho user `lab`. Lab mặc định dùng cổng 5433 để tránh PostgreSQL có sẵn ở 5432[^lab-readme]; nếu bạn đặt `PGPORT`, kiểm lại dòng `Máy chủ:` trước khi dùng kết quả.
- **Dùng một PostgreSQL 16 có sẵn thay cho container mà quên đặt cổng.** Một số README ghi "hoặc dùng PostgreSQL 16 có sẵn". Harness mặc định cổng 5433[^lab-harness], nên với PostgreSQL ở cổng 5432 bạn phải đặt `PGPORT=5432`, cùng user và mật khẩu nếu khác `lab`. Dấu hiệu quên: script báo không kết nối được tới cổng 5433. Đặt xong thì kiểm dòng `Máy chủ:`.
- **Đổi `POSTGRES_USER`, `POSTGRES_PASSWORD` hay `POSTGRES_DB` mà không thấy tác dụng.** Các biến này chỉ có tác dụng khi container khởi động với thư mục dữ liệu rỗng[^postgres-image]. Volume `pgdata` đã có dữ liệu thì database cũ được giữ nguyên.
- **Mở cổng ra mọi giao diện mạng.** Nếu `ports` không ghi host IP, Docker gắn vào `0.0.0.0` và bỏ qua tường lửa của máy[^compose-services]. Với mật khẩu yếu như `lab`, máy khác trong mạng có thể kết nối vào. Lab ghi rõ `127.0.0.1`[^lab-compose].
- **`LAB_PG_PORT` không đổi như mong muốn.** Biến môi trường của shell được ưu tiên hơn file `.env`[^compose-interpolation]. Dấu hiệu: bạn sửa `.env` mà cổng không đổi.
- **Sửa tay `output.txt` hay ghép output của nhiều lần chạy.** Dấu hiệu: thời điểm chạy trong header không khớp với ngày ghi trong README, hoặc số liệu trong README không có trong `output.txt`.
- **Kết luận vượt quá output.** Dấu hiệu: README khẳng định điều không có lệnh nào trong output đo được, ví dụ nói về hiệu năng khi lab chỉ đếm số dòng.

## Ví dụ thực tế

- [ex:lab-mvcc] — lab MVCC chạy trên PostgreSQL 16.15, ngày 15/10/2026. README có đủ câu hỏi, môi trường, lệnh chạy lại, kết luận và giới hạn:
    - Kết luận dựa trên output: sau `UPDATE`, dòng id 1 chuyển từ `ctid (0,1)`, `xmin 1517` sang `ctid (5,76)`, `xmin 1518`.
    - Mục giới hạn ghi rằng autovacuum bị tắt riêng cho bảng thử nghiệm để quan sát từng bước, và hệ thống thật không nên tắt.
- [ex:lab-lsm] — lab LSM-tree không dùng PostgreSQL: chạy RocksDB 9.8.4 qua thư viện Python `rocksdict` 0.3.25, Python 3.13.16, ngày 16/10/2026. README ghi `rocksdict` là binding cộng đồng có gói sẵn RocksDB, có lệnh chạy cho Linux kèm ghi chú đường dẫn `pip` trên Windows, và mục giới hạn ghi rằng compaction tự động bị tắt để quan sát từng bước.

## Câu hỏi tự kiểm tra

- Bạn chạy `node experiments/db-mvcc/run.mjs` và dòng `Máy chủ:` báo PostgreSQL 17. Chuyện gì có thể đã xảy ra, và bạn kiểm tra những gì?
- Bạn đổi `POSTGRES_PASSWORD` trong `docker-compose.yml`, chạy lại `docker compose up -d`, nhưng vẫn đăng nhập được bằng mật khẩu cũ. Vì sao?
- Vì sao README của lab ghi "PostgreSQL 16.15" chứ không chỉ "PostgreSQL 16", khi image dùng tag `postgres:16`?
- Một README kết luận "cách A nhanh hơn cách B", nhưng `output.txt` chỉ có số dòng trả về của mỗi cách. Kết luận đó vi phạm quy tắc nào, và nên sửa ra sao?
- Viết dòng `ports` cho một service Redis của lab, sao cho chỉ máy của bạn kết nối được và cổng trên máy đổi được bằng biến môi trường.

## Chủ đề liên quan và nguồn kiểm chứng
