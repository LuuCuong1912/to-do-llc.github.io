import { test, expect } from '@playwright/test';
import { uniqueEmail, PASSWORD, watchErrors } from './helpers.js';

// Trọn luồng của khách: xem bảng giá → đăng ký → giỏ hàng → thanh toán giả lập → dùng Todo App
test('mua gói Gold và dùng Todo App', async ({ page }) => {
  const problems = watchErrors(page);
  const cartBadge = page.locator('#cart-badge');

  await test.step('bảng giá lấy từ API, chọn số tháng đổi tổng tiền', async () => {
    await page.goto('/');
    await expect(page.locator('.package-card__name')).toHaveText(['Basic', 'Gold', 'Pro']);
    const gold = page.locator('.package-card--featured');
    await expect(gold.locator('.package-card__ribbon')).toHaveText('Phổ biến nhất');
    await gold.getByRole('radio', { name: '3 tháng' }).check();
    await expect(gold.locator('.package-card__total')).toContainText('177.000');
  });

  await test.step('khách bấm "Thêm vào giỏ" → đăng ký → quay lại bảng giá', async () => {
    await page.locator('[data-package="gold"]').click();
    await expect(page).toHaveURL(/\/pages\/login\.html\?redirect=%2F%23pricing/);
    await page.locator('#register-link').click();
    await page.getByLabel('Họ và tên').fill('Khách Mua Hàng');
    await page.getByLabel('Email').fill(uniqueEmail('shop'));
    await page.getByLabel('Mật khẩu', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Nhập lại mật khẩu').fill(PASSWORD);
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await expect(page).toHaveURL('/#pricing');
    await expect(page.locator('.navbar__user .badge')).toHaveText('Chưa có gói');
  });

  await test.step('thêm Gold 3 tháng + Basic → icon giỏ = 2', async () => {
    const gold = page.locator('.package-card--featured');
    await gold.getByRole('radio', { name: '3 tháng' }).check();
    await page.locator('[data-package="gold"]').click();
    await expect(page.locator('.toast').last()).toContainText('Đã thêm gói Gold (3 tháng)');
    await page.locator('[data-package="basic"]').click();
    await expect(cartBadge).toHaveText('2');
  });

  await test.step('giỏ hàng: đổi số tháng, xóa gói', async () => {
    await page.goto('/pages/cart.html');
    await expect(page.locator('.line-item')).toHaveCount(2);
    await page.getByLabel('Số tháng gói Gold').selectOption('6');
    await expect(page.locator('.summary__total')).toContainText('383.000');
    await page.getByRole('button', { name: 'Xóa gói Basic khỏi giỏ' }).click();
    await expect(page.locator('.line-item')).toHaveCount(1);
    await expect(page.locator('.summary__total')).toContainText('354.000');
    await expect(cartBadge).toHaveText('1');
  });

  await test.step('thanh toán giả lập → thành công, navbar hiện gói Gold', async () => {
    await page.getByRole('link', { name: 'Tiến hành thanh toán' }).click();
    await expect(page.locator('.pay-method input[value="mock"]')).toBeChecked();
    await page.getByRole('button', { name: /Thanh toán 354\.000/ }).click();
    await expect(page.locator('.result__title')).toHaveText('Thanh toán thành công');
    await expect(page.locator('.navbar__user .badge')).toHaveText('Gold');
    await expect(cartBadge).toBeHidden();
  });

  await test.step('Todo App: thêm, sửa tại chỗ, hoàn thành hết (pháo giấy), dữ liệu lưu server', async () => {
    await page.getByRole('link', { name: 'Dùng Todo App ngay' }).click();
    await expect(page.locator('.todo-app__plan')).toContainText('0 / 100 việc');
    const input = page.getByLabel('Nội dung công việc');
    for (const text of ['Học Express', 'Việc <img src=x onerror=alert(1)>', 'Viết README']) {
      await input.fill(text);
      await input.press('Enter');
    }
    await expect(page.locator('.todo-item')).toHaveCount(3);
    await expect(page.locator('.todo-item img')).toHaveCount(0);

    await page.locator('.todo-item').first().locator('.todo-item__btn--edit').click();
    await page.locator('.todo-item__edit').fill('Học Express nâng cao');
    await page.locator('.todo-item__edit').press('Enter');
    await expect(page.locator('.todo-item__text').first()).toHaveText('Học Express nâng cao');

    for (const checkbox of await page.locator('.todo-item__check').all()) await checkbox.check();
    await expect(page.locator('.todo-stats__numbers')).toHaveText('3 / 3');
    await expect.poll(() => page.evaluate(() => typeof window.confetti)).toBe('function');
    await expect(page.locator('.todo-item').first().locator('.todo-item__btn--edit')).toBeDisabled();

    await page.reload();
    await expect(page.locator('.todo-item.is-completed')).toHaveCount(3);
    await page.locator('.todo-item').last().locator('.todo-item__btn--delete').click();
    await expect(page.locator('.todo-item')).toHaveCount(2);
  });

  await test.step('trang Đơn hàng: 1 đơn đã thanh toán', async () => {
    await page.goto('/pages/orders.html');
    await expect(page.locator('.order-card')).toHaveCount(1);
    await expect(page.locator('.order-card .badge')).toHaveText('Đã thanh toán');
  });

  expect(problems).toEqual([]);
});
