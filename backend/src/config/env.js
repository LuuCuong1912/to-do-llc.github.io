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
  clientUrl: process.env.CLIENT_URL || 'http://127.0.0.1:5500',
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
};

export default env;
