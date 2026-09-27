import { test, expect } from '@playwright/test';
import { registerViaApi } from './helpers.js';

test.use({ viewport: { width: 375, height: 800 } });

test('điện thoại 375px: không trang nào tràn ngang, menu ☰ đóng/mở được', async ({ page }) => {
  await registerViaApi(page, 'mobile');
  for (const url of ['/', '/pages/cart.html', '/pages/checkout.html', '/pages/orders.html', '/pages/app.html']) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, `${url} tràn ngang`).toBeLessThanOrEqual(375);
  }

  const menu = page.locator('#navbar-menu');
  const toggle = page.getByRole('button', { name: 'Mở menu' });
  await expect(menu).toBeHidden();
  await toggle.click();
  await expect(menu).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đóng menu' })).toHaveAttribute('aria-expanded', 'true');
});

test('bộ đếm tiến độ không tràn vòng tròn khi số lớn', async ({ page }) => {
  await page.goto('/pages/app.html');
  const input = page.getByLabel('Nội dung công việc');
  await input.fill('Việc A');
  await input.press('Enter');

  const fits = await page.locator('.todo-stats__numbers').evaluate((circle) => {
    circle.querySelector('.todo-stats__done').textContent = '1000';
    circle.querySelector('.todo-stats__total').textContent = '/ 1000';
    const box = circle.getBoundingClientRect();
    return [...circle.children].every((c) => {
      const r = c.getBoundingClientRect();
      return r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom;
    });
  });
  expect(fits).toBe(true);
});
