import { test, expect } from '@playwright/test';
import { registerViaApi, watchErrors } from './helpers.js';

test.describe('Bản dùng thử (không cần đăng ký)', () => {
  test('khách: tối đa 5 việc, lưu trên trình duyệt, không sửa nội dung', async ({ page }) => {
    const problems = watchErrors(page);
    await page.goto('/');
    await page.locator('#hero-trial').click();
    await expect(page).toHaveURL('/pages/app.html');
    await expect(page.locator('.notice')).toContainText('Bạn đang dùng thử miễn phí');
    await expect(page.locator('.notice a')).toHaveText('Đăng ký');

    const input = page.getByLabel('Nội dung công việc');
    for (let i = 1; i <= 5; i++) {
      await input.fill(`Việc ${i}`);
      await input.press('Enter');
      await expect(page.locator('.todo-item')).toHaveCount(i);
    }
    await expect(input).toBeDisabled();
    await expect(page.locator('.todo-limit')).toContainText('Bản dùng thử cho phép tối đa 5');
    await expect(page.locator('.todo-item__btn--edit').first()).toBeDisabled();

    await page.locator('.todo-item__check').first().check();
    await page.reload();
    await expect(page.locator('.todo-item')).toHaveCount(5);
    await expect(page.locator('.todo-item.is-completed')).toHaveCount(1);

    await page.locator('.todo-item').last().locator('.todo-item__btn--delete').click();
    await expect(input).toBeEnabled();
    expect(problems).toEqual([]);
  });

  test('localStorage bị sửa hỏng → trang vẫn chạy', async ({ page }) => {
    await page.goto('/pages/app.html');
    await page.evaluate(() => localStorage.setItem('todopro-trial-todos', '{"hỏng": true'));
    await page.reload();
    await expect(page.locator('.todo-form')).toBeVisible();
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });

  test('đã đăng nhập nhưng chưa có gói → dùng thử, link mời "Mua gói"', async ({ page }) => {
    await registerViaApi(page, 'trialuser');
    await page.goto('/pages/app.html');
    await expect(page.locator('.notice a')).toHaveText('Mua gói');
  });
});
