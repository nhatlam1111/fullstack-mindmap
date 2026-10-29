# Lộ trình theo chặng: kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi lộ trình 24 tuần theo lịch thành 30 chặng do Lam tự chọn; thêm 28 chủ đề khung (kiến trúc ứng dụng, xử lý sự cố, Azure, thanh toán); đổi bài thực hành xuyên suốt sang app nghiên cứu thị trường game; release theo `CLAUDE.md`.

**Architecture:**
- Dữ liệu học thêm `meta.currentStage`. Một hàm thuần suy chặng từ `currentStage`, hoặc từ `startDate` cũ qua bảng đổi tuần sang chặng.
- `useWeek()` trả về chặng thay cho tuần, nên phần tính tiến độ không đổi.
- Validator chấp nhận N chặng liên tục.
- Nội dung là YAML và Markdown. Chủ đề mới chỉ có frontmatter.

**Tech Stack:** React 19, Zustand 5, Zod 3, Vite 6, Vitest 3, Playwright 1.56, tsx, YAML.

**Spec:** `docs/superpowers/specs/2026-10-29-lo-trinh-theo-chang-design.md`

## Global Constraints

- Không đổi id chủ đề hiện có. Id mới đúng theo bảng ở mục 5.2 của spec.
- Chủ đề mới: `contentStatus: skeleton`, không có thân bài.
- Giữ tên khóa `week`/`weeks`/`firstWeek` trong YAML và code. Chữ hiển thị là "Chặng".
- Link `#wN` giữ nguyên, mở chặng N.
- Thứ tự nhánh trong `content/branches.yaml`: web, fe, be, db, arch, ops, cloud, pay, ai, aidev, learn.
- Volatility: nhánh và chủ đề cloud là `fast`; arch, pay và nhóm `ops-incident` là `slow`.
- Đổi tuần cũ sang chặng mới:
  - tuần ≤ 0 thành 1;
  - tuần 1–15 giữ số;
  - 16 thành 18, 17 thành 21, 18 thành 23, 19 thành 25, 20 thành 26, 21 thành 27, 22 thành 28, 23 thành 29, 24 và 25 thành 30;
  - kết quả kẹp trong [1, N].
- Mọi chữ trên giao diện bằng tiếng Việt.
- Đề bài thực hành không bao giờ yêu cầu tự cào trang, không bao giờ để bí mật trong repo.
- Release từ bản clone `D:\lam.nguyen\Projects\fullstack-mindmap`. Publish không truyền `capabilities`.

## Review Focus

1. **`currentStage` trong kho lớn hơn N** (file sao lưu từ bản khác, hoặc lộ trình bị rút ngắn): kẹp về N, màn Hôm nay vẫn hiện chặng. Test ở Task 2.
2. **`currentStage` hỏng trong kho** (0, số âm, số lẻ, chuỗi): chỉ bỏ trường đó, giữ `lastTopicId` và `lastBackupAt`. Test ở Task 2.
3. **Hai thiết bị cùng mở lần đầu sau cập nhật:** migrate chỉ ghi khi chưa có `currentStage`, snapshot sau đó không ghi lại. Test ở Task 3.
4. **`startDate` ở tương lai:** ra chặng 1. Test ở Task 2.
5. **Ở chặng cuối:** không có nút "Xong, sang chặng …"; ở trang Lộ trình, chặng hiện tại không có nút "Học chặng này". Test ở Task 6.

## File Structure

| File | Vai trò trong thay đổi này |
|---|---|
| `scripts/lib/schema.ts`, `scripts/lib/content.ts` | Kiểm lộ trình N chặng |
| `src/store/model.ts` | `Meta.currentStage`, `stageFromLegacyWeek`, `currentStage` |
| `src/store/data.ts`, `src/store/hooks.ts` | `actions.setStage`, migrate một lần, nhập file sao lưu, `useWeek` |
| `src/App.tsx`, `src/views/Today.tsx`, `src/views/Roadmap.tsx`, `src/views/DataView.tsx`, `src/components/TopicArticle.tsx`, `src/lib/dates.ts` | Giao diện theo chặng |
| `content/branches.yaml`, `content/topics/{arch,ops,cloud,pay}/*.md` | 28 chủ đề khung |
| `content/roadmap.yaml`, `content/topics/learn/learn-practice-case.md` | 30 chặng, bài thực hành mới |
| 4 bài đã kiểm chứng, `lab/…` (chú thích), `README.md` | Bỏ chỗ nhắc bài thực hành cũ |
| `tests/unit/{validate,model,sync}.test.ts`, `tests/e2e/app.spec.ts` | Test |

---

### Task 0: Nhánh làm việc

- [ ] **Step 1:** `git switch -c lo-trinh-theo-chang`. Expected: `Switched to a new branch 'lo-trinh-theo-chang'`.
- [ ] **Step 2:** commit spec và plan.

```bash
git add docs/superpowers
git commit -m "docs: thiết kế và kế hoạch lộ trình theo chặng"
```

### Task 1: Validator chấp nhận N chặng

**Files:**
- Modify: `scripts/lib/schema.ts:62-72`
- Modify: `scripts/lib/content.ts:171-185`
- Test: `tests/unit/validate.test.ts`

**Interfaces:**
- Produces: `RoadmapFile`, trong đó `weeks` là mảng tối thiểu 1 phần tử, `week` là số nguyên ≥ 1 và không có giới hạn trên.
- Produces, các thông điệp lỗi và cảnh báo:
  - `roadmap.yaml: chặng ${n} xuất hiện ${count} lần (cần đúng 1)`, với n chạy từ 1 tới N = số chặng lớn nhất;
  - `roadmap.yaml: chặng ${w} trỏ tới chủ đề "${tid}" không tồn tại`;
  - `roadmap.yaml: các giai đoạn phải phủ đúng chặng 1–${N}, mỗi chặng một lần`;
  - cảnh báo `${file}: chưa nằm trong chặng nào của lộ trình`.

- [ ] **Step 1: Viết test.**
  - Thay helper `weeks` bằng `range(n)` (trả `[1..n]`) và `roadmap(nums: number[], topics: string[], phaseWeeks = nums)`. Hàm `roadmap` trả về toàn bộ file YAML: một giai đoạn `p1` chứa `phaseWeeks`, và mỗi số trong `nums` là một chặng.
  - `beforeEach` gọi `roadmap(range(24), ['t1'])`.
  - Thay test `bắt lộ trình thiếu tuần` bằng ba test sau:

```ts
it('lộ trình 30 chặng hợp lệ', () => {
  write('content/roadmap.yaml', roadmap(range(30), ['t1']));
  expect(run().errors).toEqual([]);
});
it('bắt chặng nhảy số', () => {
  write('content/roadmap.yaml', roadmap([1, 2, 4], ['t1']));
  expect(run().errors.join('\n')).toMatch(/chặng 3 xuất hiện 0 lần/);
});
it('bắt giai đoạn không phủ đủ chặng', () => {
  write('content/roadmap.yaml', roadmap([1, 2], ['t1'], [1]));
  expect(run().errors.join('\n')).toMatch(/phủ đúng chặng 1–2/);
});
```

- [ ] **Step 2:** `npx vitest run tests/unit/validate.test.ts`. Expected: 3 test mới FAIL (sẽ thấy lỗi `max(24)` và câu thông báo chữ "tuần").
- [ ] **Step 3: Sửa code.**
  - `schema.ts`: bỏ `.max(24)`, thêm `.min(1)` cho mảng `weeks`.
  - `content.ts`: N = `Math.max(...weekNums)`. Lặp n từ 1 tới N với các thông điệp ở mục Interfaces. Giai đoạn so với dãy 1..N.
- [ ] **Step 4:** `npx vitest run tests/unit/validate.test.ts`. Expected: PASS hết. `npm run validate`: 0 lỗi (lộ trình hiện tại 24 chặng vẫn hợp lệ).
- [ ] **Step 5:** `git commit -am "feat: validator chấp nhận lộ trình N chặng"`

### Task 2: Mô hình chặng hiện tại

**Files:**
- Modify: `src/store/model.ts:16-46`
- Test: `tests/unit/model.test.ts`

**Interfaces:**
- Consumes: `currentWeek(startDate, todayIso)` và `addDays` trong `src/lib/dates.ts` (giữ nguyên).
- Produces:
  - `Meta.currentStage?: number`;
  - trong `MetaSchema`: `currentStage: z.number().int().min(1).optional().catch(undefined)`;
  - `export function stageFromLegacyWeek(week: number): number`, không kẹp N;
  - `export function currentStage(meta: Pick<Meta, 'currentStage' | 'startDate'>, todayIso: string, total: number): number | null`. Ưu tiên `currentStage`, sau đó `startDate` qua `stageFromLegacyWeek`, cuối cùng kẹp [1, total]. Không có cả hai thì trả `null`.

- [ ] **Step 1: Viết test** trong `describe('chặng hiện tại')`:

```ts
it('đổi tuần cũ sang chặng mới', () => {
  const m: [number, number][] = [[0,1],[1,1],[15,15],[16,18],[17,21],[18,23],[19,25],[20,26],[21,27],[22,28],[23,29],[24,30],[25,30]];
  for (const [w, s] of m) expect(stageFromLegacyWeek(w)).toBe(s);
});
it('ưu tiên currentStage, kẹp về tổng số chặng', () => {
  expect(currentStage({ currentStage: 5, startDate: '2020-01-01' }, '2026-10-29', 30)).toBe(5);
  expect(currentStage({ currentStage: 40 }, '2026-10-29', 30)).toBe(30);
});
it('chỉ có startDate: suy từ tuần cũ', () => {
  expect(currentStage({ startDate: '2026-10-15' }, '2026-10-29', 30)).toBe(3);
  expect(currentStage({ startDate: '2026-11-05' }, '2026-10-29', 30)).toBe(1);
  expect(currentStage({ startDate: '2026-01-01' }, '2026-10-29', 20)).toBe(20);
});
it('chưa có gì thì null', () => { expect(currentStage({}, '2026-10-29', 30)).toBeNull(); });
it('currentStage hỏng chỉ bỏ trường đó', () => {
  for (const bad of [0, -2, 1.5, 'x']) {
    const r = MetaSchema.parse({ schemaVersion: 1, updatedAt: '2026-10-29T00:00:00Z', lastTopicId: 'db-mvcc', currentStage: bad });
    expect(r.currentStage).toBeUndefined();
    expect(r.lastTopicId).toBe('db-mvcc');
  }
});
it('file sao lưu có currentStage được nhận', () => {
  // dùng lại `ok` của describe('file sao lưu'), meta thêm currentStage: 7
  expect(migrateBackup(okWithStage).meta.currentStage).toBe(7);
});
```

- [ ] **Step 2:** `npx vitest run tests/unit/model.test.ts`. Expected: FAIL, `stageFromLegacyWeek is not exported`.
- [ ] **Step 3:** Cài phần ở mục Interfaces vào `src/store/model.ts`. Bảng đổi 16–25 viết thành một mảng hằng.
- [ ] **Step 4:** `npx vitest run tests/unit/model.test.ts`. Expected: PASS.
- [ ] **Step 5:** `git commit -am "feat: mô hình chặng hiện tại và đổi tuần cũ sang chặng"`

### Task 3: Lưu chặng, migrate một lần, nhập file sao lưu

**Files:**
- Modify: `src/store/data.ts:168-176` (`onRemote`), `:224-229`, `:261-263` (`setStartDate`), `:285-287` (nhập file)
- Modify: `src/store/hooks.ts:28-31`
- Test: `tests/unit/sync.test.ts`

**Interfaces:**
- Consumes: `currentStage` của Task 2, `content.weeks.length` từ `src/content.ts`.
- Produces:
  - `actions.setStage(stage: number): void`, ghi `meta.currentStage`. `setStartDate` bị xóa.
  - `useWeek(): number | null` (giữ tên), trả về `currentStage(meta, today(), content.weeks.length)`.
  - Hàm nội bộ `migrateStage()` gọi cuối `onRemote` sau `reconcile()`. Chỉ ghi khi `meta.currentStage == null` và có `meta.startDate`.
  - `importBackup`:
    - chế độ `replace`: lưu cả `currentStage`, `startDate`, `lastTopicId` của file;
    - chế độ `merge`: đặt `currentStage` của file chỉ khi hiện chưa có, `startDate` giữ như cũ.

- [ ] **Step 1: Viết test.**
  - Với các test cần dữ liệu có sẵn: gọi `__resetForTests()`, tạo `FakeBackend` mới tên `b2`, đặt `b2.docs` trước rồi mới gọi `__setBackendForTests(b2)`.
  - Dùng `addDays(today(), -14)` từ `src/lib/dates` để ra tuần 3.
  - Import thêm `selectMeta` từ `src/store/data`.
  - Định nghĩa `const meta = () => selectMeta(viewDocs(useData.getState()))`.

```ts
it('meta cũ chỉ có startDate: ghi currentStage một lần', async () => {
  // docs.meta = { schemaVersion: 1, startDate: addDays(today(), -14), updatedAt: '2026-10-01T00:00:00.000Z' }
  await __flushNow();
  expect((b2.docs.meta as { currentStage: number }).currentStage).toBe(3);
  b2.emit(); await __flushNow();
  expect(b2.writes.filter((w) => w === 'meta')).toHaveLength(1);
});
it('đã có currentStage thì không ghi meta', async () => {
  // docs.meta có currentStage: 2 và startDate
  await __flushNow();
  expect(b2.writes).not.toContain('meta');
});
it('setStage ghi chặng', () => {
  actions.setStage(4);
  expect(selectMeta(viewDocs(useData.getState())).currentStage).toBe(4);
});
it('nhập thay thế lấy chặng của file; gộp không đè chặng đang có', () => {
  const m = (s?: number) => ({ schemaVersion: 1, updatedAt: '2026-10-29T00:00:00.000Z', ...(s ? { currentStage: s } : {}) });
  actions.importBackup({}, m(9), 'merge');   expect(meta().currentStage).toBe(9);
  actions.importBackup({}, m(12), 'merge');  expect(meta().currentStage).toBe(9);
  actions.importBackup({}, m(12), 'replace'); expect(meta().currentStage).toBe(12);
});
```

- [ ] **Step 2:** `npx vitest run tests/unit/sync.test.ts`. Expected: 4 test mới FAIL.
- [ ] **Step 3:** Cài phần ở mục Interfaces.
- [ ] **Step 4:** `npx vitest run`. Expected: toàn bộ unit test PASS. `npx tsc --noEmit -p tsconfig.json` sẽ báo lỗi ở chỗ còn gọi `setStartDate` (`Today.tsx`, `DataView.tsx`): đây là việc của Task 6, ghi nhận và chưa sửa.
- [ ] **Step 5:** `git commit -am "feat: lưu chặng hiện tại, migrate từ ngày bắt đầu cũ"`

### Task 4: Ba nhánh mới, nhóm `ops-incident` và 28 chủ đề khung

**Files:**
- Modify: `content/branches.yaml`. Chèn `arch` sau `db`, `cloud` và `pay` sau `ops`. Thêm nhóm `ops-incident` "Xử lý sự cố" vào cuối nhánh `ops`.
- Create: các file `.md` trong `content/topics/arch/` (7), `content/topics/ops/` (4: `ops-incident-response`, `ops-on-call`, `ops-runbook`, `ops-postmortem`), `content/topics/cloud/` (11), `content/topics/pay/` (6). Id, nhóm và tiêu đề theo các bảng ở mục 5.2 của spec.
- Modify (do build ghi): `content/ids.lock`

**Interfaces:** Produces 28 id, `content/roadmap.yaml` ở Task 5 sẽ dùng chúng.

Mẫu một file (giá trị `related` lấy theo gợi ý ở mục 5.2; `summary` một câu do người làm viết):

```yaml
---
id: cloud-key-vault
title: "Azure Key Vault"
parent: cloud-run
summary: "Lưu khóa, bí mật và chứng chỉ ngoài code; ứng dụng đọc bằng managed identity."
contentStatus: skeleton
volatility: fast
prerequisites: []
related:
  - ops-config-secrets
  - cloud-managed-identity
---
```

- [ ] **Step 1:** Sửa `branches.yaml` và tạo 28 file.
- [ ] **Step 2:** `npm run validate`.
  - Expected: dòng cuối là `176 chủ đề (… skeleton: 156 … draft: 5 … verified: 15) · 0 lỗi`.
  - Có 28 cảnh báo "chưa nằm trong chặng nào", sẽ hết ở Task 5.
  - Nếu Task 1 chưa đổi chữ thì cảnh báo còn ghi "tuần".
- [ ] **Step 3:** `npm run content` để build ghi 28 id vào `content/ids.lock`. Expected: `git diff --stat content/ids.lock` có 28 dòng thêm.
- [ ] **Step 4:** `git add content && git commit -m "content: 28 chủ đề khung cho kiến trúc ứng dụng, xử lý sự cố, Azure, thanh toán"`

### Task 5: Lộ trình 30 chặng và bài thực hành mới

**Files:**
- Modify: `content/roadmap.yaml` (viết lại toàn bộ)
- Modify: `content/topics/learn/learn-practice-case.md` (đổi `title`, `summary`, thêm `changelog`)

**Interfaces:** Consumes 28 id của Task 4. Produces tiêu đề chặng 1 "Database, schema và mô hình quan hệ" và chặng 2 "Transaction, isolation, MVCC và locking" (giữ như cũ). Test e2e ở Task 6 dựa vào hai tiêu đề này.

- [ ] **Step 1: Viết `roadmap.yaml`.**
  - Chú thích đầu file nêu đúng ba ý:
    - lộ trình gồm các chặng có thứ tự, học theo tốc độ riêng;
    - bài thực hành xuyên suốt là hệ thống nghiên cứu thị trường game (`learn-practice-case`), chỉ PostgreSQL, TypeScript, Azure;
    - khóa `week` là số thứ tự chặng.
  - `phases`: p1–p11 theo bảng giai đoạn ở mục 5.4.
  - `weeks`: 30 mục theo bảng chặng ở mục 5.4.
    - Chặng có nguồn "cũ N": `title` và `goal` lấy từ tuần N, chỉnh nhẹ nếu cần; `topics` chép nguyên danh sách của tuần N, chặng 24 thêm `be-idempotency`.
    - `practice` và `checkpoint` viết thành câu hoàn chỉnh từ dàn ý; mục ghi "Như cũ" thì giữ câu cũ, chỉ đổi tên app.
  - Đổi số tuần cũ sang chặng mới: 1–15 giữ số; 16→18, 17→21, 18→23, 19→25, 20→26, 21→27, 22→28, 23→29, 24→30.
- [ ] **Step 2:** Sửa `learn-practice-case.md`: `title` và `summary` đúng chữ ở mục 5.2 của spec; thêm `changelog` với `date` là ngày làm và note "Đổi bài thực hành sang hệ thống nghiên cứu thị trường game mobile".
- [ ] **Step 3:** `npm run validate`. Expected: `0 lỗi`, không còn cảnh báo "chưa nằm trong chặng nào".
- [ ] **Step 4:** kiểm chữ còn sót.
  - `rg -n "quản lý yêu cầu|GitLab|Vite|24 tuần" content/roadmap.yaml`. Expected: không có kết quả.
  - `rg -n "Oracle" content/roadmap.yaml`. Expected: chỉ một dòng, là `checkpoint` của chặng 2 ("đối chiếu với Oracle đã biết").
  - `rg -n "cào|scrap" content/roadmap.yaml`. Expected: không có kết quả.
- [ ] **Step 5:** `git commit -am "content: lộ trình 30 chặng với bài thực hành nghiên cứu thị trường game"`

### Task 6: Giao diện theo chặng

**Files:**
- Modify: `src/App.tsx:77`
- Modify: `src/views/Today.tsx`
- Modify: `src/views/Roadmap.tsx`
- Modify: `src/views/DataView.tsx:48,84-97`
- Modify: `src/components/TopicArticle.tsx:56,79`
- Modify: `src/lib/dates.ts` (xóa `weekRange`)
- Test: `tests/e2e/app.spec.ts`

**Interfaces:** Consumes `useWeek()`, `actions.setStage(n)`, `content.weeks` (N = `content.weeks.length`).

Chữ hiển thị, đúng từng chữ:

| Chỗ | Chữ |
|---|---|
| Thanh trên `.week-stamp` | `Chặng {n}/{N}` (hiện khi chặng khác null) |
| Hôm nay: lede | `Chặng {n}/{N}` |
| Hôm nay: eyebrow của thẻ | `Chặng này` |
| Hôm nay: nút sang chặng tiếp (chỉ khi n < N) | `Xong, sang chặng {n+1}` |
| Hôm nay: thẻ khi chưa có chặng | eyebrow `Bắt đầu lộ trình`, h2 `Chọn chặng bắt đầu`, mô tả `Chặng hiện tại cho biết bạn đang học tới đâu. Đổi lại được ở trang Lộ trình hoặc mục Dữ liệu học.`, ô chọn (nhãn ẩn `Chặng bắt đầu`, mục `{n}. {title}`, mặc định 1), nút `Bắt đầu` |
| Hôm nay: ghi chú tiến độ | `Số chủ đề Đã hiểu trên số chủ đề đã có bài hoặc thuộc các chặng bạn đã tới.`; aria-label khi rỗng `Chưa tới chặng học` |
| Lộ trình: h1 | `Lộ trình` |
| Lộ trình: lede | `Học theo tốc độ riêng: xong chặng nào thì chuyển sang chặng tiếp. Bài thực hành xuyên suốt là ` + link `#learn-practice-case` chữ `hệ thống nghiên cứu thị trường game mobile` + `.` |
| Lộ trình: tiêu đề giai đoạn | `{title} · chặng {a}–{b}` (một chặng thì `chặng {a}`) |
| Lộ trình: eyebrow | `Chặng {n}` + ` · chặng hiện tại` nếu là chặng hiện tại |
| Lộ trình: nút ở chặng không phải hiện tại | `Học chặng này` |
| Dữ liệu học: thẻ | h2 `Chặng hiện tại`, ô chọn (nhãn ẩn `Chặng hiện tại`), nút `Lưu` (vô hiệu khi trùng chặng đang có) |
| Trang bài: chip | `Chặng {w}` |
| Bài khung | `Bài này chưa được viết. Theo lộ trình, nó sẽ được biên soạn ở chặng {n}.` (link `#w{n}` trên `chặng {n}`) |

Bỏ khoảng ngày ở Hôm nay và Lộ trình, bỏ hai thông báo "Sắp bắt đầu" và "Đã qua 24 tuần", bỏ thẻ chọn ngày.

- [ ] **Step 1: Viết test e2e.** Đổi tên và sửa test đầu, thêm ba test:

```ts
test('chế độ cục bộ: chọn chặng bắt đầu, hiện chặng hiện tại', async ({ page }) => {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await expect(page.locator('.week-stamp')).toHaveText('Chặng 1/30');
  await expect(page.getByRole('heading', { name: 'Database, schema và mô hình quan hệ' })).toBeVisible();
});
test('xong chặng thì sang chặng tiếp', async ({ page }) => {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('button', { name: 'Xong, sang chặng 2' }).click();
  await expect(page.locator('.week-stamp')).toHaveText('Chặng 2/30');
  await expect(page.getByRole('heading', { name: 'Transaction, isolation, MVCC và locking' })).toBeVisible();
});
test('chặng cuối không có nút sang chặng tiếp', async ({ page }) => {
  await fakeClaude(page, { meta: { schemaVersion: 1, currentStage: 30, updatedAt: '2026-10-29T00:00:00.000Z' } });
  await page.goto(APP + '#today');
  await expect(page.locator('.week-stamp')).toHaveText('Chặng 30/30');
  await expect(page.getByRole('button', { name: /^Xong, sang chặng/ })).toHaveCount(0);
});
test('chọn chặng trên trang Lộ trình', async ({ page }) => {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.goto(APP + '#w18');
  await page.locator('#week-18').getByRole('button', { name: 'Học chặng này' }).click();
  await expect(page.locator('.week-stamp')).toHaveText('Chặng 18/30');
  await expect(page.locator('#week-18').getByRole('button', { name: 'Học chặng này' })).toHaveCount(0);
});
```

- [ ] **Step 2:** `npm run build && npx playwright test tests/e2e/app.spec.ts`. Expected: 4 test trên FAIL.
- [ ] **Step 3:** Sửa giao diện theo bảng chữ ở trên.
- [ ] **Step 4:** chạy kiểm tra.
  - `npx tsc --noEmit -p tsconfig.json && npx eslint .` Expected: không lỗi, không còn ai gọi `setStartDate` hay `weekRange`.
  - `npm run build && npx playwright test`. Expected: PASS toàn bộ e2e, kể cả các test axe và test bàn phím có sẵn.
- [ ] **Step 5:** `git commit -am "feat: giao diện lộ trình theo chặng tự chọn"`

### Task 7: Bỏ chỗ nhắc bài thực hành cũ

**Files** (đổi đúng các chữ dưới đây, không đụng chỗ khác):

| File | Cũ | Mới |
|---|---|---|
| `content/topics/aidev/aidev-writing-specs.md:109` | `Bài thực hành tuần 1 yêu cầu viết đặc tả ứng dụng quản lý yêu cầu nội bộ đủ rõ để giao cho agent.` | `Bạn cần viết đặc tả cho một ứng dụng nhỏ, đủ rõ để giao cho agent.` |
| `content/topics/db/db-schema-data-model.md:133` | `Lấy ví dụ từ bài thực hành quản lý yêu cầu:` | `Chọn một ứng dụng bạn đang làm:` |
| `content/topics/db/db-normalization.md:72` | `Áp vào bài thực hành:` | `Áp vào kịch bản của lab ở mục Ví dụ:` |
| `content/topics/db/db-transaction-acid.md:77` | `Duyệt một yêu cầu trong bài thực hành nghĩa là` | `Trong kịch bản của lab ở mục Ví dụ, duyệt một yêu cầu nghĩa là` |
| `lab/experiments/db-tables-keys-constraints/README.md:27` và `run.mjs:1` | `bài thực hành tuần 1` | `bài thực hành ở chặng 1` |
| `lab/lib/requests-1m.mjs:1` | `các lab tuần 3` | `các lab chặng 3` |
| `lab/docker-compose.yml:25` | `Tuần 5 thêm` | `Chặng 5 thêm` |
| `README.md:3` | `fullstack trong 24 tuần.` | `fullstack, học theo từng chặng.` |
| `README.md:14` | `24 tuần: mục tiêu, bài thực hành, mốc kiểm tra, chủ đề` | `Các chặng của lộ trình: mục tiêu, bài thực hành, mốc kiểm tra, chủ đề` |

Mỗi bài trong 4 bài thêm một dòng `changelog` với `date` là ngày làm, note `Bỏ chỗ nhắc bài thực hành cũ; nhận định, nguồn và ví dụ không đổi.` Không đổi `verifiedAt` và `verifiedBy`.

- [ ] **Step 1:** Sửa theo bảng.
- [ ] **Step 2:** `rg -n "bài thực hành tuần|quản lý yêu cầu nội bộ|24 tuần" --glob '!releases.md' --glob '!docs/**' --glob '!releases/**' --glob '!node_modules/**' --glob '!dist/**'`. Expected: không có kết quả.
- [ ] **Step 3:** `npm run validate`. Expected: `0 lỗi`, vẫn 15 bài verified.
- [ ] **Step 4:** `git commit -am "content: bỏ chỗ nhắc bài thực hành cũ trong bài đã kiểm chứng và lab"`

### Task 8: Phản biện độc lập cho các đoạn đã sửa

- [ ] **Step 1:** Giao cho một subagent mới (general-purpose) đọc `git diff main -- content/topics lab/experiments`, kèm toàn văn 4 bài. Yêu cầu nó trả về từng phát hiện, ghi mức `blocker`, `major` hoặc `minor`, theo ba tiêu chí:
  - nghĩa của nhận định không đổi;
  - câu hỏi tự kiểm tra trả lời được chỉ bằng nội dung bài;
  - không có nhận định mới thiếu nguồn.
- [ ] **Step 2:** Còn blocker hoặc major thì sửa rồi cho một subagent mới phản biện lại. Nếu vẫn còn thì đổi bài đó về `contentStatus: draft`, bỏ `verifiedAt` và `verifiedBy`, và báo Lam.
- [ ] **Step 3:** Ghi kết quả (số phát hiện theo mức, đã xử lý thế nào) vào commit message của lần sửa cuối, hoặc commit rỗng nếu không cần sửa: `git commit --allow-empty -m "review: phản biện đoạn sửa ở 4 bài đã kiểm chứng — <kết quả>"`.

### Task 9: Release

Theo `CLAUDE.md`, build ngay trong bản clone (bỏ bước đóng gói và stage).

- [ ] **Step 1:** `npm ci` rồi `npm run release`. Expected: mọi bước "xong", dòng cuối `Sẵn sàng publish: dist/artifact.html (…) · chủ đề {"skeleton":156,"draft":5,"verified":15}`. Có bước lỗi thì dừng, báo Lam, không publish.
- [ ] **Step 2:** Hỏi Lam xác nhận trước khi publish và push, kèm số chủ đề, kích thước bản build và kết quả Task 8.
- [ ] **Step 3:** Đọc artifact (`Artifact` action `read`, url `https://claude.ai/artifact/4TNPENW2kRQLTwQ38LPK7Y`), rồi publish `dist/artifact.html` vào đúng url đó, không truyền `capabilities`.
- [ ] **Step 4:** `ArtifactData` get `data/users/me`, doc `meta`. Expected: còn `lastTopicId: "db-sql-nosql-terms"`. Liệt kê `data/users/me` để chắc các bản ghi `t.*` vẫn còn.
- [ ] **Step 5:** Thêm một dòng vào `releases.md` (ngày, "Lộ trình 30 chặng tự chọn; 28 chủ đề khung (kiến trúc ứng dụng, xử lý sự cố, Azure, thanh toán); bài thực hành nghiên cứu thị trường game; 5 bài Database lên Nháp", `156 / 5 / 15`). Chép `dist/artifact.html` và `dist/release.json` vào `releases/last-good/`. `content/ids.lock` đã nằm trong repo. Commit.
- [ ] **Step 6:** `git switch main && git merge --ff-only lo-trinh-theo-chang && git push origin main`. Expected: push thành công; workflow Pages chạy (`gh run list --limit 1`).
- [ ] **Step 7:** Chép source về `D:\lam.nguyen\Projects\MindMap`.
  - Trong Git Bash: `tar -czf .sync/source-$(date +%Y%m%d%H%M%S).tar.gz --exclude=node_modules --exclude=dist --exclude=src/generated --exclude=.sync --exclude=.git .`
  - Giải nén vào `MindMap` bằng `tar -xzf <file> --overwrite --no-same-owner --no-same-permissions -C /d/lam.nguyen/Projects/MindMap`.
  - So md5 của mọi file đã chép giữa hai bên. Expected: khớp hết.
