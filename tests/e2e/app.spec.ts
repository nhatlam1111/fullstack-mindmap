import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APP, blockNetwork, fakeClaude } from './helpers';

test.beforeEach(async ({ page }) => { await blockNetwork(page); });

test('chế độ cục bộ: chọn chặng bắt đầu, hiện chặng hiện tại', async ({ page }) => {
  await page.goto(APP);
  await expect(page.getByText('Chế độ cục bộ.')).toBeVisible();
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

test('trước khi tải xong dữ liệu không bấm được nút chọn chặng', async ({ page }) => {
  await fakeClaude(page, { meta: { schemaVersion: 1, currentStage: 5, updatedAt: '2026-10-29T00:00:00.000Z' } }, { snapshotDelayMs: 1500 });
  await page.goto(APP + '#today');
  await expect(page.getByRole('heading', { name: 'Hôm nay' })).toBeVisible();
  expect(await page.getByRole('heading', { name: 'Chọn chặng bắt đầu' }).count()).toBe(0);
  await expect(page.locator('.week-stamp')).toHaveText('Chặng 5/30');

  // goto chỉ đổi hash không tải lại trang; reload để snapshot lại bị làm chậm
  await page.goto(APP + '#roadmap');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Lộ trình', level: 1 })).toBeVisible();
  expect(await page.getByRole('button', { name: 'Học chặng này' }).count()).toBe(0);
  await expect(page.getByRole('button', { name: 'Học chặng này' })).toHaveCount(29);

  await page.goto(APP + '#data');
  await page.reload();
  const card = page.locator('section', { has: page.locator('#sd-h') });
  await card.getByLabel('Chặng hiện tại').selectOption('7');
  expect(await card.getByRole('button', { name: 'Lưu' }).isDisabled()).toBe(true);
});

test('chọn chặng trên trang Lộ trình', async ({ page }) => {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.goto(APP + '#w18');
  await page.locator('#week-18').getByRole('button', { name: 'Học chặng này' }).click();
  await expect(page.locator('.week-stamp')).toHaveText('Chặng 18/30');
  await expect(page.locator('#week-18').getByRole('button', { name: 'Học chặng này' })).toHaveCount(0);
});

test('cây chủ đề dùng được bằng bàn phím', async ({ page }) => {
  await page.goto(APP + '#today');
  const tree = page.getByRole('tree', { name: 'Cây kiến thức' });
  await tree.getByRole('treeitem', { name: 'Nền tảng web' }).focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
  await expect(page.locator(':focus')).toHaveAttribute('aria-label', 'Database và quản lý dữ liệu');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#db-database-dbms$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Database, DBMS và RDBMS');
});

test('mở thẳng một chủ đề, ghi chú và checklist còn sau khi tải lại', async ({ page }) => {
  await page.goto(APP + '#db-mvcc');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('MVCC');
  await expect(page.getByText(/Claude kiểm chứng/)).toBeVisible();
  await page.getByLabel('Ghi chú cho chủ đề này').fill('Update tạo phiên bản mới; VACUUM dọn bản cũ.');
  await page.getByLabel('Trả lời được các câu hỏi tự kiểm tra mà không xem bài').check();
  await page.getByLabel('Chạy lại thử nghiệm trong lab hoặc đọc kỹ ví dụ thực tế, hoặc ghi lý do không cần').check();
  const mark = page.getByRole('button', { name: 'Đánh dấu Đã hiểu' });
  await expect(mark).toBeDisabled();
  await page.getByLabel('Có ghi chú tự giải thích bằng lời của mình').check();
  await expect(mark).toBeEnabled();
  await expect(page.getByText('Đã lưu')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Ghi chú cho chủ đề này')).toHaveValue('Update tạo phiên bản mới; VACUUM dọn bản cũ.');
  await expect(page.getByLabel('Có ghi chú tự giải thích bằng lời của mình')).toBeChecked();
  await page.getByRole('button', { name: 'Đánh dấu Đã hiểu' }).click();
  await expect(page.getByText(/Lần ôn tiếp theo/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Lần ôn tiếp theo/)).toBeVisible();
});

test('link tới id không tồn tại hiện trang không tìm thấy', async ({ page }) => {
  await page.goto(APP + '#khong-co-chu-de-nay');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy' })).toBeVisible();
});

test('tìm kiếm không dấu, kể cả chữ đ, mở đúng bài', async ({ page }) => {
  await page.goto(APP);
  await page.keyboard.press('Control+k');
  await page.getByRole('searchbox').fill('xu ly dong thoi');
  await expect(page.getByRole('listbox', { name: 'Kết quả' }).getByRole('option').first()).toContainText('Mô hình xử lý đồng thời');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#be-concurrency-models$/);
});

test('xuất, nhập file lỗi, nhập file đúng và hoàn tác', async ({ page }) => {
  await page.goto(APP + '#db-locking');
  await page.getByLabel('Ghi chú cho chủ đề này').fill('ghi chú gốc');
  await expect(page.getByText('Đã lưu')).toBeVisible();
  await page.goto(APP + '#data');
  await page.getByRole('button', { name: 'Xuất file sao lưu' }).click();
  const json = await page.getByLabel('Nội dung file sao lưu').inputValue();
  const backup = JSON.parse(json);
  expect(backup.topics['db-locking'].note).toBe('ghi chú gốc');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-'));
  const bad = path.join(dir, 'bad.json');
  fs.writeFileSync(bad, '{"app":"khac"}');
  await page.getByLabel('Chọn file .json').setInputFiles(bad);
  await expect(page.getByRole('alert')).toContainText('Không nhập được.');

  backup.topics['db-locking'] = { ...backup.topics['db-locking'], note: 'ghi chú từ file', updatedAt: '2999-01-01T00:00:00.000Z' };
  const good = path.join(dir, 'good.json');
  fs.writeFileSync(good, JSON.stringify(backup));
  await page.getByLabel('Chọn file .json').setInputFiles(good);
  await page.getByRole('button', { name: 'Nhập dữ liệu' }).click();
  await page.getByRole('button', { name: 'Gộp dữ liệu' }).click();
  await expect(page.getByText(/Đã nhập: 1 chủ đề thay đổi/)).toBeVisible();
  await page.goto(APP + '#db-locking');
  await expect(page.getByLabel('Ghi chú cho chủ đề này')).toHaveValue('ghi chú từ file');

  await page.goto(APP + '#data');
  await page.getByRole('button', { name: 'Hoàn tác lần nhập' }).click();
  await page.getByRole('button', { name: 'Khôi phục' }).click();
  await page.goto(APP + '#db-locking');
  await expect(page.getByLabel('Ghi chú cho chủ đề này')).toHaveValue('ghi chú gốc');
});

test('kho dữ liệu claude.ai: ghi vào vùng riêng, hiện dữ liệu từ thiết bị khác, ôn tập', async ({ page }) => {
  await fakeClaude(page, {
    't.db-isolation-levels': { learnStatus: 'understood', checklist: { selfTest: true, experiment: true, ownWords: true }, note: 'ghi trên điện thoại', review: { intervalDays: 7, dueAt: '2020-01-01' }, updatedAt: '2026-10-01T00:00:00.000Z' },
  });
  await page.goto(APP);
  await expect(page.locator('.sync')).toHaveAttribute('data-status', 'synced');
  await expect(page.getByText('1 chủ đề đến hạn')).toBeVisible();

  await page.goto(APP + '#db-isolation-levels');
  await expect(page.getByLabel('Ghi chú cho chủ đề này')).toHaveValue('ghi trên điện thoại');

  await page.goto(APP + '#review');
  await expect(page.getByRole('heading', { name: 'Isolation level' })).toBeVisible();
  await expect(page.getByText('Ở Read Committed trên PostgreSQL', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: /Nhớ rõ/ }).click();
  await expect(page.getByText('Không có chủ đề nào đến hạn ôn.', { exact: false })).toBeVisible();
  const doc = await page.evaluate(() => (window as unknown as { __fake: { docs: Record<string, { review: { intervalDays: number } }>; paths: string[] } }).__fake);
  expect(doc.docs['t.db-isolation-levels'].review.intervalDays).toBe(21);
  expect(doc.paths.every((p) => p.startsWith('data/users/u_test/'))).toBe(true);

  await page.goto(APP + '#data');
  await page.getByRole('button', { name: 'Xuất file sao lưu' }).click();
  await expect(page.getByText(/Đã lưu fsmap-backup-\d{4}-\d{2}-\d{2}\.json/)).toBeVisible();
});

test('mất kết nối: thay đổi được giữ và gửi lại', async ({ page }) => {
  await fakeClaude(page);
  await page.goto(APP + '#db-mvcc');
  await expect(page.locator('.sync')).toHaveAttribute('data-status', /synced|pending/);
  await page.evaluate(() => { (window as unknown as { __fake: { fail: number } }).__fake.fail = 1; });
  await page.getByLabel('Có ghi chú tự giải thích bằng lời của mình').check();
  await expect(page.locator('.sync')).toHaveAttribute('data-status', 'offline');
  await expect(page.locator('.sync')).toHaveAttribute('data-status', 'synced', { timeout: 10_000 });
  const ok = await page.evaluate(() => (window as unknown as { __fake: { docs: Record<string, { checklist: { ownWords: boolean } }> } }).__fake.docs['t.db-mvcc'].checklist.ownWords);
  expect(ok).toBe(true);
});

test('bản đồ: mở nhánh, chọn chủ đề hiện bài bên phải', async ({ page }) => {
  await page.goto(APP + '#map');
  await page.locator('.mm-branch', { hasText: 'Database và quản lý dữ liệu' }).click();
  await page.locator('.mm-topic', { hasText: 'Isolation level' }).click();
  await expect(page.getByRole('complementary', { name: 'Bài học đang chọn' }).getByRole('heading', { level: 1 })).toHaveText('Isolation level');
});

test('bản đồ: chú thích số đếm nói theo chặng', async ({ page }) => {
  await page.goto(APP + '#map');
  await expect(page.locator('.mm-branch .count').first()).toHaveAttribute('title', 'Đã hiểu / chủ đề đã có bài hoặc thuộc các chặng bạn đã tới');
});

for (const hash of ['today', 'db-mvcc', 'roadmap', 'data', 'review', 'map']) {
  test(`accessibility: không có lỗi axe nghiêm trọng ở #${hash}`, async ({ page }) => {
    await page.goto(APP + '#' + hash);
    await page.waitForTimeout(300);
    const r = await new AxeBuilder({ page: page as never }).exclude('.react-flow__renderer').analyze();
    const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
}
