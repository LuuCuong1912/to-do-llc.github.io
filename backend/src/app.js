import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Middleware chạy THEO THỨ TỰ khai báo:
app.use(helmet()); // 1. Thêm các HTTP header bảo mật
app.use(cors({ origin: env.clientUrl, credentials: true })); // 2. Cho phép Frontend gọi API và gửi cookie
app.use(express.json({ limit: '100kb' })); // 3. Đọc body JSON → req.body
app.use(cookieParser()); // 4. Đọc cookie → req.cookies

app.use('/api', routes); // 5. Các route của ứng dụng

app.use(notFound); // 6. Không route nào khớp → 404
app.use(errorHandler); // 7. Bắt mọi lỗi (luôn đặt cuối)

export default app;
