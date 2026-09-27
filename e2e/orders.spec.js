import { test, expect } from '@playwright/test';
import { registerViaApi, addToCartViaApi, watchErrors } from './helpers.js';

test('đơn chờ thanh toán: hiện hạn chót, hủy đơn, trang kết quả báo "Đơn hàng đã hủy"', async ({ page }) => {
  const problems = watchErrors(page); // tự bấm OK ở hộp xác nhận "Hủy đơn?"
  await registerViaApi(page, 'cancel');
  await addToCartViaApi(page, 'gold');
  const order = (await (await page.request.post('/api/orders', { data: { paymentMethod: 'mock' } })).json()).data.order;

  await page.goto('/pages/orders.html');
  const card = page.locator('.order-card');
  await expect(card).toContainText('Thanh toán trước');
  await expect(card.getByRole('button')).toHaveText(['Hủy đơn', 'Thanh toán']);

  await card.getByRole('button', { name: 'Hủy đơn' }).click();
  await expect(card.locator('.badge')).toHaveText('Đã hủy');
  await expect(card.getByRole('button')).toHaveCount(0);

  await page.goto(`/pages/payment-result.html?orderId=${order.id}`);
  await expect(page.locator('.result__title')).toHaveText('Đơn hàng đã hủy');
  expect(problems).toEqual([]);
});
