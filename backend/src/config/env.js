import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Thiếu biến bắt buộc thì dừng ngay lúc khởi động, thay vì lỗi khó hiểu lúc đang chạy
const REQUIRED = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`❌ Thiếu biến môi trường: ${missing.join(', ')}. Xem file .env.example`);
  process.exit(1);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 3000,
  // Nhiều địa chỉ Frontend, cách nhau bởi dấu phẩy
  clientUrls: (process.env.CLIENT_URL || 'http://127.0.0.1:5500')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  // 'lax' khi Frontend và Backend cùng site (mặc định); 'none' khi khác tên miền (bắt buộc HTTPS)
  cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',
  // Deploy 1 dịch vụ: Express phục vụ luôn thư mục frontend/ → cùng tên miền, không lo CORS/cookie
  serveFrontend: process.env.SERVE_FRONTEND === 'true',
  // Chạy sau proxy (Render, Railway, Nginx...) → lấy đúng IP người dùng cho rate limit và VNPay
  trustProxy: process.env.TRUST_PROXY === 'true',
  payment: {
    // Thanh toán giả lập — bật mặc định để demo; đặt PAYMENT_MOCK_ENABLED=false để tắt
    mockEnabled: process.env.PAYMENT_MOCK_ENABLED !== 'false',
    vnpay: {
      tmnCode: process.env.VNP_TMN_CODE || '',
      hashSecret: process.env.VNP_HASH_SECRET || '',
      url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl: process.env.VNP_RETURN_URL || '',
      // Chỉ dùng khi dev trên máy cá nhân (VNPay không gọi được IPN vào localhost): xác nhận đơn ở Return URL
      confirmOnReturn: process.env.VNP_CONFIRM_ON_RETURN === 'true',
    },
  },
};

env.payment.vnpay.enabled = Boolean(
  env.payment.vnpay.tmnCode && env.payment.vnpay.hashSecret && env.payment.vnpay.returnUrl,
);

export default env;
