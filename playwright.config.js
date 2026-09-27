import { defineConfig, devices } from '@playwright/test';

// Test e2e: chạy website thật trên trình duyệt thật.
// Playwright tự khởi động Backend ở chế độ deploy (Express phục vụ luôn frontend/) trên cổng riêng 3100,
// với khóa VNPay GIẢ để thử luồng thanh toán. Database: đọc DB_* từ backend/.env (hoặc biến môi trường của CI).
// Dữ liệu test dùng email đuôi @e2e.test và được xóa sau khi chạy (e2e/global-teardown.js).
const PORT = 3100;
export const BASE_URL = `http://127.0.0.1:${PORT}`;
export const VNP_TEST_SECRET = 'e2e-test-secret';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // dùng chung 1 database + rate limit đăng nhập → chạy tuần tự cho ổn định
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalTeardown: './e2e/global-teardown.js',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // Máy cá nhân: dùng Google Chrome đã cài sẵn (không cần tải trình duyệt). CI: Chromium của Playwright.
      use: { ...devices['Desktop Chrome'], channel: process.env.CI ? undefined : 'chrome' },
    },
  ],
  webServer: {
    command: 'npm --prefix backend start',
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      PORT: String(PORT),
      SERVE_FRONTEND: 'true',
      CLIENT_URL: BASE_URL,
      PAYMENT_MOCK_ENABLED: 'true',
      VNP_TMN_CODE: 'E2ETEST',
      VNP_HASH_SECRET: VNP_TEST_SECRET,
      VNP_RETURN_URL: `${BASE_URL}/api/payments/vnpay/return`,
    },
  },
});
