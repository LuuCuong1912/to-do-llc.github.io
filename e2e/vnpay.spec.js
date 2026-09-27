import { test, expect } from '@playwright/test';
import { registerViaApi, addToCartViaApi, vnpaySignedQuery } from './helpers.js';

// VNPay với khóa GIẢ: chặn trang sandbox thật, tự đóng vai VNPay gửi IPN (có chữ ký) rồi đưa người dùng quay về
test('thanh toán VNPay: chuyển sang VNPay → IPN tới trễ → trang kết quả tự cập nhật', async ({ page }) => {
  await registerViaApi(page, 'vnpay');
  await addToCartViaApi(page, 'pro');

  // Trả về 1 trang "VNPay giả" (không chặn/abort): abort làm trình duyệt chuyển sang trang lỗi của Chrome,
  // lần chuyển trang đó có thể chen ngang page.goto() bên dưới → test lúc đạt lúc lỗi.
  await page.route('https://sandbox.vnpayment.vn/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>VNPay sandbox (giả lập)</h1>' }),
  );

  await page.goto('/pages/checkout.html');
  await page.locator('.pay-method input[value="vnpay"]').check();
  await page.getByRole('button', { name: /Thanh toán/ }).click();
  await page.waitForURL(/^https:\/\/sandbox\.vnpayment\.vn\//); // chờ trình duyệt ĐÃ ở trang VNPay
  const paymentUrl = new URL(page.url());
  expect(paymentUrl.searchParams.get('vnp_Amount')).toBe('9900000');

  const q = Object.fromEntries(paymentUrl.searchParams);
  const query = vnpaySignedQuery({
    vnp_TxnRef: q.vnp_TxnRef,
    vnp_Amount: q.vnp_Amount,
    vnp_ResponseCode: '00',
    vnp_TransactionStatus: '00',
    vnp_TransactionNo: '14000099',
    vnp_TmnCode: q.vnp_TmnCode,
  });

  // Người dùng quay về TRƯỚC, IPN tới SAU 3 giây → trang kết quả phải tự hỏi lại
  setTimeout(() => page.request.get(`/api/payments/vnpay/ipn?${query}`), 3000);
  await page.goto(`/api/payments/vnpay/return?${query}`);
  await expect(page).toHaveURL(/\/pages\/payment-result\.html\?orderId=\d+/);
  await expect(page.locator('.result')).toHaveAttribute('data-status', 'paid', { timeout: 15_000 });
  await expect(page.locator('.navbar__user .badge')).toHaveText('Pro');
});
