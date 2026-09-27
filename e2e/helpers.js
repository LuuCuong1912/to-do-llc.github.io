import crypto from 'node:crypto';
import { expect } from '@playwright/test';
import { VNP_TEST_SECRET } from '../playwright.config.js';

let counter = 0;
export const uniqueEmail = (prefix = 'u') => `${prefix}${Date.now()}${counter++}@e2e.test`;
export const PASSWORD = 'matkhau123';

// Đăng ký qua API (nhanh). page.request dùng chung cookie với trình duyệt → trang sau đó đã đăng nhập.
export const registerViaApi = async (page, prefix = 'api') => {
  const email = uniqueEmail(prefix);
  const res = await page.request.post('/api/auth/register', {
    data: { fullName: `E2E ${prefix}`, email, password: PASSWORD },
  });
  expect(res.status()).toBe(201);
  return email;
};

export const packageId = async (page, code) => {
  const { data } = await (await page.request.get('/api/packages')).json();
  return data.packages.find((p) => p.code === code).id;
};

export const addToCartViaApi = async (page, code, months = 1) => {
  const res = await page.request.post('/api/cart/items', { data: { packageId: await packageId(page, code), months } });
  expect(res.status()).toBe(201);
};

// Ký dữ liệu giống VNPay (theo code mẫu của VNPay) để giả lập VNPay gọi IPN / Return URL
export const vnpaySignedQuery = (params) => {
  const data = Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&');
  const hash = crypto.createHmac('sha512', VNP_TEST_SECRET).update(Buffer.from(data, 'utf-8')).digest('hex');
  return new URLSearchParams({ ...params, vnp_SecureHash: hash }).toString();
};

// Theo dõi lỗi JS / hộp thoại (vd alert do XSS) trong suốt 1 test. 401 của /auth/me khi chưa đăng nhập là bình thường.
export const watchErrors = (page) => {
  const problems = [];
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('401')) problems.push(`console: ${msg.text()}`);
  });
  page.on('dialog', async (dialog) => {
    if (dialog.type() === 'confirm') return dialog.accept(); // hộp xác nhận "Hủy đơn?"
    problems.push(`dialog: ${dialog.message()}`);
    await dialog.dismiss();
  });
  return problems;
};
