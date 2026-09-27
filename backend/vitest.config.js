import { defineConfig } from 'vitest/config';

// Test KHÔNG cần MySQL: lớp model được giả lập (vi.mock). Biến môi trường giả để config/env.js không dừng chương trình.
// dotenv không ghi đè biến đã có → giá trị dưới đây luôn được dùng khi chạy test, kể cả khi có file .env.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js', 'tests/api/**/*.test.js'],
    env: {
      NODE_ENV: 'test',
      DB_HOST: '127.0.0.1',
      DB_USER: 'test',
      DB_PASSWORD: 'test',
      DB_NAME: 'todopro_test',
      JWT_SECRET: 'test-jwt-secret',
      CLIENT_URL: 'http://127.0.0.1:5500',
      PAYMENT_MOCK_ENABLED: 'true',
      VNP_TMN_CODE: 'TESTCODE',
      VNP_HASH_SECRET: 'test-hash-secret',
      VNP_RETURN_URL: 'http://127.0.0.1:3000/api/payments/vnpay/return',
    },
  },
});
