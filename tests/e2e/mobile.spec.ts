import { test, expect } from '@playwright/test';
import { APP, blockNetwork } from './helpers';

test.beforeEach(async ({ page }) => { await blockNetwork(page); });

test('điện thoại: thanh điều hướng dưới, không có bản đồ, không cuộn ngang', async ({ page }) => {
  await page.goto(APP);
  const nav = page.locator('.bottom-nav');
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Bản đồ' })).toBeHidden();
  await nav.getByRole('link', { name: 'Cây' }).click();
  await expect(page.getByRole('heading', { name: 'Cây kiến thức' })).toBeVisible();
  for (const hash of ['today', 'db-n-plus-one', 'roadmap', 'data', 'map']) {
    await page.goto(APP + '#' + hash);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `cuộn ngang ở #${hash}`).toBeLessThanOrEqual(0);
  }
  await page.goto(APP + '#map');
  await expect(page.getByText('Bản đồ chỉ hiển thị trên màn hình rộng.')).toBeVisible();
});
