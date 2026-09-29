import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';

import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import { checkOrigin } from './middlewares/origin-check.middleware.js';

const app = express();
const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend');

if (env.trustProxy) app.set('trust proxy', 1);

// Middleware chạy THEO THỨ TỰ khai báo:
// 1. HTTP header bảo mật. CSP chỉ cho tải script/style/font từ chính trang (mọi thư viện đều tự host).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'font-src': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'form-action': ["'self'"],
      },
    },
  }),
);
app.use(compression()); // Nén gzip phản hồi (JSON, HTML, CSS, JS) — giảm ~70% dung lượng truyền đi
app.use(cors({ origin: env.clientUrls, credentials: true })); // 2. Cho phép Frontend gọi API và gửi cookie
app.use(express.json({ limit: '100kb' })); // 3. Đọc body JSON → req.body
app.use(cookieParser()); // 4. Đọc cookie → req.cookies

app.use('/api', checkOrigin, routes); // 5. Chống CSRF → các route của ứng dụng

// 6. (Tùy chọn) phục vụ giao diện từ cùng server khi deploy
// Cache: ảnh/icon ít đổi → trình duyệt giữ 7 ngày. HTML/CSS/JS chưa có mã phiên bản trong tên file
// → "no-cache": vẫn lưu nhưng hỏi lại server mỗi lần (ETag), file không đổi thì server trả 304 rất nhẹ.
const setStaticCache = (res, filePath) => {
  const isAsset = filePath.includes(`${path.sep}assets${path.sep}`);
  res.setHeader('Cache-Control', isAsset ? 'public, max-age=604800' : 'no-cache');
};
if (env.serveFrontend) {
  app.use(express.static(frontendDir, { extensions: ['html'], setHeaders: setStaticCache }));
}

app.use(notFound); // 7. Không route nào khớp → 404
app.use(errorHandler); // 8. Bắt mọi lỗi (luôn đặt cuối)

export default app;
