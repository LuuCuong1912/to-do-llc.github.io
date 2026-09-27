import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import { checkOrigin } from './middlewares/origin-check.middleware.js';

const app = express();
const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend');

if (env.trustProxy) app.set('trust proxy', 1);

// Middleware chạy THEO THỨ TỰ khai báo:
// 1. HTTP header bảo mật. CSP chỉ cho tải script/style/font từ chính trang và các CDN đang dùng.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
        'style-src': ["'self'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        'img-src': ["'self'", 'data:'],
        'form-action': ["'self'"],
      },
    },
  }),
);
app.use(cors({ origin: env.clientUrls, credentials: true })); // 2. Cho phép Frontend gọi API và gửi cookie
app.use(express.json({ limit: '100kb' })); // 3. Đọc body JSON → req.body
app.use(cookieParser()); // 4. Đọc cookie → req.cookies

app.use('/api', checkOrigin, routes); // 5. Chống CSRF → các route của ứng dụng

// 6. (Tùy chọn) phục vụ giao diện từ cùng server khi deploy
if (env.serveFrontend) app.use(express.static(frontendDir, { extensions: ['html'] }));

app.use(notFound); // 7. Không route nào khớp → 404
app.use(errorHandler); // 8. Bắt mọi lỗi (luôn đặt cuối)

export default app;
