import { defineConfig } from 'vitest/config';

// Test TÍCH HỢP: chạy với MySQL THẬT (đọc DB_* từ backend/.env, hoặc biến môi trường của CI).
// Chỉ ghi đè cấu hình VNPay bằng khóa giả để thử luồng thanh toán mà không cần tài khoản sandbox.
// Dữ liệu test dùng email đuôi @it.test và được xóa sau mỗi file (tests/integration/helpers.js).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.js'],
    fileParallelism: false, // các file dùng chung 1 database → chạy lần lượt
    testTimeout: 20000,
    env: {
      NODE_ENV: 'test',
      PAYMENT_MOCK_ENABLED: 'true',
      VNP_TMN_CODE: 'TESTCODE',
      VNP_HASH_SECRET: 'integration-test-secret',
      VNP_RETURN_URL: 'http://127.0.0.1:3000/api/payments/vnpay/return',
    },
  },
});
