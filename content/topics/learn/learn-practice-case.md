---
id: learn-practice-case
title: "Case: hệ thống nghiên cứu thị trường game mobile"
parent: learn-practice
summary: "Bài thực hành xuyên suốt: thu thập bảng xếp hạng game Google Play qua SerpApi, thống kê game lớn nhất và mới nổi, đề xuất thể loại; chạy trên Azure, công khai trên GitHub."
contentStatus: draft
volatility: fast
prerequisites: []
related:
  - learn-capstone
  - learn-lab
  - aidev-writing-specs
  - db-schema-data-model
  - cloud-container-apps
  - cloud-managed-identity
sources:
  - id: mm-roadmap
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/content/roadmap.yaml
    title: "fullstack-mindmap — content/roadmap.yaml (30 chặng)"
    supports: "Lộ trình 30 chặng chia 11 giai đoạn; mỗi chặng có mục tiêu, bài thực hành và mốc kiểm tra. Chặng 1: viết đặc tả ngắn cho hệ thống nghiên cứu thị trường game đủ rõ để giao cho coding agent; tạo tài khoản SerpApi gói Free, gọi tay Google Play API một lần lấy JSON bảng xếp hạng game của một quốc gia, lưu làm mẫu, không commit API key; thiết kế schema PostgreSQL. Chặng 15: nhập hằng tuần bằng background job có retry và backoff theo giới hạn 50 lượt mỗi giờ của SerpApi, idempotency key là quốc gia, bảng xếp hạng và tuần, contract test với JSON mẫu đã lưu ở chặng 1. Chặng 17: nguồn dữ liệu đặt sau một port với adapter SerpApi và adapter giả; mốc kiểm tra là toàn bộ test chạy mà không gọi SerpApi. Chặng 19: tự tạo tài khoản Azure, đưa API và web lên Container Apps. Chặng 30: hoàn thiện app, README nêu kiến trúc, ADR, số đo thật, link bản chạy trên Azure."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: mm-practice-design
    url: https://github.com/nhatlam1111/fullstack-mindmap/blob/main/docs/superpowers/specs/2026-10-29-lo-trinh-theo-chang-design.md
    title: "fullstack-mindmap — thiết kế lộ trình theo chặng, mục 1, 3 và 5.3 (29/10/2026)"
    supports: "Mục 1: Lam muốn app thực hành theo sở thích là hệ thống nghiên cứu thị trường game mobile, chạy trên Azure miễn phí, công khai trên GitHub, và sẽ dùng kết quả của app để tham khảo trước khi tự làm game đưa lên Google Play. Mục 5.3: nguồn dữ liệu là SerpApi Google Play API gói Free, không tự cào trang. Mặc định 5 quốc gia (VN, US, JP, KR, ID) × 2 bảng xếp hạng game (miễn phí và doanh thu cao), chụp mỗi tuần: khoảng 10 lượt mỗi tuần, khoảng 43 lượt mỗi tháng. Chỉ quan sát game trong top 50 của các bảng đã chụp. Game lớn nhất: mốc lượt tải cao nhất và điểm từ 4 sao, mốc chữ đổi thành số cận dưới. Game mới nổi theo tuần và tháng: vào bảng lần đầu, tăng hạng mạnh, hoặc lên mốc lượt tải cao hơn. Thể loại nổi bật: tổng hợp các chỉ số theo thể loại. Khách xem dashboard chỉ đọc, admin cấu hình và nhập tay. Hạ tầng: repo công khai, GitHub Actions, Azure Container Apps và Container Apps job, PostgreSQL managed, Key Vault đọc bằng managed identity, GitHub Actions đăng nhập Azure bằng OIDC. Chưa thử bằng key thật nên chưa biết ghép được chart, apps_category và gl trong một lượt gọi hay không; chưa xác minh PostgreSQL flexible server có trong gói miễn phí 12 tháng hay không."
    product: fullstack-mindmap
    version: "0.1.0"
    checkedAt: 2026-10-29
  - id: serpapi-google-play
    url: https://serpapi.com/google-play-api
    title: "SerpApi — Google Play Store API"
    supports: "engine=google_play; gl là mã quốc gia hai chữ, mặc định us; hl là mã ngôn ngữ; apps_category là danh mục; chart hiện bảng xếp hạng, trả tối đa 50 kết quả, giá trị lấy từ chart_options[index].value (ví dụ topselling_free), không dùng cùng next_page_token, section_page_token hay see_more_token; kết quả cache hết hạn sau 1 giờ, lượt trúng cache miễn phí và không tính vào hạn mức tháng, no_cache=true buộc lấy mới. Trang không có ví dụ phản hồi của chart; phản hồi mẫu là kết quả tìm kiếm theo q, app nằm ở organic_results[].items. Mỗi app trong phản hồi mẫu có title, product_id, rating, author, category, downloads; mục mẫu là Extreme Car Driving Simulator (com.aim.racing), rating 4.3, tác giả AxesInMotion Racing, thể loại Racing, downloads 500,000,000+. Tài liệu không nói apps_category có ghép được với chart hay không."
    product: SerpApi Google Play API
    checkedAt: 2026-10-29
  - id: serpapi-pricing
    url: https://serpapi.com/pricing
    title: "SerpApi — Pricing"
    supports: "Gói Free 0 USD: 250 lượt tìm mỗi tháng, throughput 50 lượt mỗi giờ; chỉ lượt thành công được tính, lượt trúng cache, lỗi hoặc thất bại không tính. U.S. Legal Shield được mô tả là bảo hiểm tới 2 triệu USD cho việc scraping and parsing of search engine data; gói Free không có U.S. Legal Shield, ZeroTrace Mode và Priority Support."
    product: SerpApi
    checkedAt: 2026-10-29
  - id: aca-pricing
    url: https://azure.microsoft.com/en-us/pricing/details/container-apps/
    title: "Microsoft Azure — Container Apps pricing"
    supports: "Gói Consumption có free grant mỗi tháng, tính trên mỗi subscription: 180.000 vCPU-giây, 360.000 GiB-giây và 2 triệu request. Khi app thu về số replica tối thiểu, replica không hoạt động được tính ở mức giá idle thấp hơn; giá idle là giá sau free grant vCPU-giây và GiB-giây."
    product: Azure Container Apps
    checkedAt: 2026-10-29
  - id: google-terms
    url: https://policies.google.com/terms?hl=en
    title: "Google Terms of Service (hiệu lực 30/7/2026)"
    supports: "Không được dùng phương tiện tự động để truy cập nội dung từ dịch vụ của Google trái với chỉ dẫn máy đọc được như robots.txt. Cào nội dung không thuộc về mình được nêu là một ví dụ hành vi có thể dẫn tới việc Google đình chỉ hoặc chấm dứt quyền truy cập dịch vụ, hoặc xóa tài khoản Google."
    product: Google Terms of Service
    version: "30/7/2026"
    checkedAt: 2026-10-29
examples:
  - id: serpapi-sample
    kind: official-doc
    title: "Phản hồi mẫu của Google Play API trong tài liệu SerpApi"
    url: https://serpapi.com/google-play-api
    checkedAt: 2026-10-29
changelog:
  - date: 2026-10-29
    note: Đổi bài thực hành sang hệ thống nghiên cứu thị trường game mobile.
  - date: 2026-10-29
    note: "Claude soạn bài từ lộ trình, bản thiết kế ngày 29/10, tài liệu SerpApi, bảng giá Azure Container Apps và điều khoản Google; đổi độ ổn định sang fast vì bài dựa vào hạn mức miễn phí có thể đổi."
  - date: 2026-10-29
    note: "Phản biện vòng 1: nói đúng mức điều khoản Google và thêm đánh đổi khi dùng SerpApi; ghi rõ phản hồi mẫu là kết quả tìm kiếm, chưa biết phản hồi chart có rating và downloads; viết lại cách hạn mức bị tính và câu hỏi tương ứng; ghi ngày đọc bảng giá SerpApi; gắn nguồn cho lý do chọn app và cách đổi mốc lượt tải."
  - date: 2026-10-29
    note: "Phản biện vòng 2: ghi ngày đọc tài liệu SerpApi; giải thích free grant, vCPU-giây, GiB-giây và trỏ tới các bài cloud của chặng 19."
---

## Vấn đề cần giải quyết

Học 30 chặng mà chỉ đọc bài thì kiến thức rời rạc: biết index, biết cache, biết OIDC, nhưng chưa từng ghép chúng vào một hệ thống chạy thật. Một app thực hành xuyên suốt cho mỗi chặng một chỗ để áp dụng, và cuối lộ trình để lại một repo công khai có kiến trúc, ADR và số đo thật[^mm-roadmap].

App được chọn theo sở thích của Lam: nghiên cứu thị trường game mobile, để tham khảo trước khi tự làm game đưa lên Google Play[^mm-practice-design]. App cần bảng xếp hạng game theo quốc gia, điểm đánh giá và lượt tải.

Cái khó đầu tiên là nguồn dữ liệu. Điều khoản Google (hiệu lực 30/7/2026) cấm dùng phương tiện tự động để truy cập nội dung trái với chỉ dẫn máy đọc được như `robots.txt`. Điều khoản cũng nêu việc cào nội dung không thuộc về mình là một ví dụ hành vi có thể khiến Google đình chỉ quyền truy cập hoặc xóa tài khoản[^google-terms]. Bản thiết kế chọn không tự cào trang mà lấy dữ liệu qua một API bên thứ ba là SerpApi[^mm-practice-design].

## Cơ chế và luồng hoạt động

**Nguồn dữ liệu: SerpApi Google Play API** (tài liệu SerpApi đọc ngày 29/10/2026)[^serpapi-google-play]:

- Gọi với `engine=google_play`. `gl` chọn quốc gia (mã hai chữ, mặc định `us`), `hl` chọn ngôn ngữ, `apps_category` chọn danh mục.
- `chart` lấy bảng xếp hạng, ví dụ `topselling_free`, tối đa 50 kết quả. Giá trị hợp lệ lấy từ `chart_options` trong chính phản hồi JSON.
- Phản hồi mẫu trên trang tài liệu là kết quả tìm kiếm theo `q` (nằm trong `organic_results[].items`), không phải phản hồi của `chart`. Mỗi app trong mẫu đó có `title`, `product_id`, `rating`, `author`, `category`, `downloads`; `downloads` là mốc chữ, ví dụ "500,000,000+". Trang không có ví dụ phản hồi của `chart`.
- Kết quả được cache 1 giờ. Lượt trúng cache không tính vào hạn mức tháng; `no_cache=true` buộc lấy dữ liệu mới.

**Ngân sách gọi API.** Gói Free cho 250 lượt mỗi tháng, tối đa 50 lượt mỗi giờ, và chỉ lượt thành công mới bị tính; lượt trúng cache, lỗi hay thất bại không bị tính (bảng giá SerpApi đọc ngày 29/10/2026)[^serpapi-pricing]. Mặc định app theo dõi 5 quốc gia (VN, US, JP, KR, ID) × 2 bảng xếp hạng game (miễn phí và doanh thu cao), chụp mỗi tuần một lần. Như vậy là khoảng 10 lượt mỗi tuần, khoảng 43 lượt mỗi tháng; phần còn lại dành cho thử nghiệm[^mm-practice-design].

**App tính gì từ dữ liệu**[^mm-practice-design]:

- **Game lớn nhất:** mốc lượt tải cao nhất và điểm từ 4 sao trở lên, theo từng quốc gia và gộp chung. Mốc chữ đổi thành số cận dưới, ví dụ "10,000,000+" thành 10.000.000.
- **Game mới nổi** theo tuần và theo tháng: vào bảng lần đầu, tăng hạng mạnh, hoặc lên mốc lượt tải cao hơn giữa các lần chụp. Ngưỡng do người làm tự chọn.
- **Thể loại nổi bật:** tổng hợp các chỉ số trên theo thể loại. Đây là phần "đề xuất" của app: danh sách thể loại đáng tham khảo trước khi chọn làm game.

**Người dùng**[^mm-practice-design]: khách xem dashboard công khai, chỉ đọc; admin cấu hình quốc gia và bảng xếp hạng, chạy nhập tay.

**App lớn dần theo các giai đoạn của lộ trình**[^mm-roadmap]:

| Giai đoạn | Chặng | Phần của app |
|---|---|---|
| Database và dữ liệu | 1–6 | Đặc tả, JSON mẫu từ SerpApi, schema PostgreSQL, chống nhập trùng, index, cache, migration |
| Nền tảng web, Frontend | 7–12 | HTTP cache cho API, frontend Next.js, màn bảng xếp hạng, form admin |
| Backend và tích hợp | 13–15 | Mô hình lỗi, OpenAPI, đăng nhập admin, job nhập hằng tuần có retry và idempotency |
| Kiến trúc ứng dụng | 16–17 | Module theo bounded context, port cho nguồn dữ liệu, outbox |
| Container, CI/CD và Azure | 18–20 | Dockerfile, GitHub Actions, Container Apps, Key Vault, Terraform |
| Vận hành, bảo mật, kiến trúc hệ thống | 21–23 | Log, metric, trace, cảnh báo, runbook, postmortem, ADR |
| Tiền và thanh toán | 24 | Thử nghiệm riêng ngoài app: sổ cái kép, idempotency, đối soát |
| AI | 25–29 | Báo cáo xu hướng bằng LLM, embedding, eval, giao việc cho coding agent |
| Tổng hợp | 30 | README, ADR, số đo thật, link bản chạy trên Azure |

**Hạ tầng**[^mm-practice-design]: repo công khai trên GitHub, CI/CD bằng GitHub Actions. API và web chạy trên Azure Container Apps, nhập hằng tuần bằng Container Apps job, database là PostgreSQL managed. SerpApi key nằm trong Key Vault, app đọc bằng managed identity. GitHub Actions đăng nhập Azure qua OIDC federation, không lưu secret của Azure trong GitHub.

Container Apps gói Consumption có free grant, tức lượng dùng miễn phí mỗi tháng, tính trên mỗi subscription: 180.000 vCPU-giây, 360.000 GiB-giây và 2 triệu request (bảng giá đọc ngày 29/10/2026)[^aca-pricing]. vCPU-giây và GiB-giây là đơn vị tính theo số vCPU và số GiB bộ nhớ mà app dùng, nhân với số giây chạy. Managed identity, Key Vault và OIDC federation được học ở chặng 19, trong các bài `cloud-managed-identity`, `cloud-key-vault` và `cloud-iam-rbac`.

## Điều kiện áp dụng, lợi ích và đánh đổi

**Lợi ích.** Mỗi chặng có một việc cụ thể trên cùng một app, nên kiến thức mới được dùng ngay trên dữ liệu và code của các chặng trước. Cuối lộ trình, repo công khai cho người phỏng vấn thấy kiến trúc, ADR, số đo thật và bản chạy trên Azure[^mm-roadmap].

**Giới hạn của dữ liệu.**

- **Chỉ thấy top 50.** `chart` trả tối đa 50 kết quả[^serpapi-google-play], nên app chỉ quan sát những game có mặt trong top 50 của các bảng đã chụp. Đề bài phải ghi rõ giới hạn này[^mm-practice-design]. "Game lớn nhất" là lớn nhất trong phạm vi đó, không phải của cả thị trường.
- **Lượt tải là mốc, không phải số đếm.** `downloads` là mốc chữ như "500,000,000+"[^serpapi-google-play], và app đổi mốc đó thành số cận dưới[^mm-practice-design]. Hai game cùng mốc có thể chênh nhau nhiều. "Lên mốc cao hơn" chỉ phát hiện được khi game vượt qua một mốc.
- **Chưa biết `chart` có ghép được với danh mục game không.** Tài liệu SerpApi không nói `apps_category` có dùng được cùng `chart` hay không[^serpapi-google-play], và việc này chưa được thử bằng key thật[^mm-practice-design]. Nếu không ghép được, app lấy bảng xếp hạng chung rồi lọc theo trường `category` của từng app[^mm-practice-design]. Khi đó, mỗi bảng có thể có ít hơn 50 game, vì bảng chung còn chứa cả app không phải game.
- **Chưa biết phản hồi của `chart` có `rating` và `downloads` hay không.** Trường của app chỉ được thấy trong phản hồi mẫu của tìm kiếm theo `q`[^serpapi-google-play]. "Game lớn nhất" và "lên mốc lượt tải" đều cần hai trường này. Việc gọi tay bằng key thật ở chặng 1 phải kiểm điều này trước khi thiết kế schema; nếu thiếu thì phải tìm cách khác để có hai trường này, và ngân sách lượt gọi có thể phải tính lại.

**Giới hạn của gói miễn phí.**

- 250 lượt mỗi tháng (đọc ngày 29/10/2026)[^serpapi-pricing] là đủ cho lịch chụp mặc định, nhưng không đủ để thêm nhiều quốc gia hay chụp hằng ngày.
- **Dùng SerpApi là chuyển việc truy cập Google sang một bên thứ ba,** không phải là có dữ liệu chính thức từ Google. Trang giá của SerpApi mô tả U.S. Legal Shield là bảo hiểm tới 2 triệu USD cho việc "scraping and parsing of search engine data", và gói Free không có Legal Shield[^serpapi-pricing].
- Free grant của Container Apps tính trên mỗi subscription[^aca-pricing]. Còn PostgreSQL managed có nằm trong gói miễn phí hay không thì chưa được xác minh[^mm-practice-design]; nếu không, chặng 19 phải chọn phương án khác và ghi ADR.
- Hạn mức và bảng giá có thể đổi bất cứ lúc nào. Vì vậy bài này để độ ổn định "Thay đổi nhanh" và phải được rà lại mỗi 3 tháng.

**Khi nào không nên làm theo đề bài này.** Nếu bạn cần số liệu chính xác để ra quyết định kinh doanh, dữ liệu top 50 với mốc lượt tải là không đủ. App này để học và để tham khảo xu hướng.

## Lỗi thường gặp và dấu hiệu nhận biết

- **Commit SerpApi key vào repo công khai.** Dấu hiệu: chuỗi `api_key=` có giá trị thật trong code, file `.env` đã commit hay log của CI. Chặng 1 đã ghi rõ không commit key[^mm-roadmap]; từ chặng 19, key nằm trong Key Vault[^mm-practice-design].
- **Đốt hết hạn mức khi đang phát triển.** Dấu hiệu: hết 250 lượt giữa tháng. Chỉ lượt thành công mới bị tính[^serpapi-pricing], và lượt gọi lại cùng tham số trong vòng 1 giờ trúng cache nên miễn phí[^serpapi-google-play]. Vì vậy, hạn mức bị đốt khi app gọi thành công lặp đi lặp lại sau khi cache đã hết hạn, ví dụ chạy lại cả job nhập mỗi lần sửa code cách nhau vài giờ, hoặc bật `no_cache=true` khi không cần. Lưu JSON mẫu một lần ở chặng 1 rồi dùng nó cho test: chặng 15 có contract test với JSON mẫu đó, và mốc kiểm tra của chặng 17 là toàn bộ test chạy mà không gọi SerpApi[^mm-roadmap].
- **Coi mốc lượt tải là số chính xác.** Dấu hiệu: báo cáo ghi "game A có 10.000.000 lượt tải" thay vì "từ 10.000.000 trở lên".
- **Suy rộng từ top 50 ra cả thị trường.** Dấu hiệu: kết luận "thể loại X ít người chơi" chỉ vì X ít xuất hiện trong top 50.
- **Tự cào trang Google Play khi API không đủ.** Điều khoản Google nêu việc cào nội dung không thuộc về mình là ví dụ hành vi có thể dẫn tới đình chỉ quyền truy cập hay xóa tài khoản[^google-terms]. Bản thiết kế của app đã chọn không làm việc này[^mm-practice-design].

## Ví dụ thực tế

- [ex:serpapi-sample] — phản hồi mẫu của tìm kiếm theo `q` trong tài liệu SerpApi Google Play API (`organic_results[0].items[0]`)[^serpapi-google-play] cho thấy dữ liệu của một app:
    - `title`: Extreme Car Driving Simulator; `product_id`: `com.aim.racing`; `author`: AxesInMotion Racing; `category`: Racing.
    - `rating`: 4.3; `downloads`: "500,000,000+".
    - Theo cách tính của app, game này đạt điều kiện từ 4 sao, và mốc lượt tải được lưu thành cận dưới 500.000.000.

## Câu hỏi tự kiểm tra

- Với 5 quốc gia × 2 bảng xếp hạng chụp mỗi tuần, một tháng dùng khoảng bao nhiêu lượt SerpApi? Nếu muốn thêm 5 quốc gia nữa thì còn lại bao nhiêu lượt cho thử nghiệm trong gói Free?
- Hai game cùng có `downloads` là "10,000,000+", một game 4,6 sao và một game 3,9 sao. Theo định nghĩa của app, game nào được tính là "game lớn nhất"? Thông tin nào bạn không suy ra được từ hai mốc lượt tải đó?
- Nếu `chart` không ghép được với `apps_category`, app lấy dữ liệu thế nào? Cách đó làm thay đổi phạm vi quan sát ra sao?
- Vì sao app không tự cào Google Play? Nêu điều khoản và hậu quả có thể gặp.
- Bạn chạy lại cả job nhập (5 quốc gia × 2 bảng) mỗi lần sửa code, cách nhau vài giờ, mười lần trong một ngày. Ngày đó tốn khoảng bao nhiêu lượt? Nếu mười lần đó cách nhau chỉ vài phút với cùng tham số thì sao? Chặng nào của lộ trình giúp test không cần gọi SerpApi?

## Chủ đề liên quan và nguồn kiểm chứng
