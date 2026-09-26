# Giai đoạn 1 — Dựng khung Backend (Express + MVC)

**Mục tiêu:** Server Express chạy được, có đủ các lớp thư mục, có cách xử lý lỗi thống nhất. Chưa có chức năng thật.

## Việc cần làm

- [ ] `cd backend && npm init -y`, trong `package.json` đặt `"type": "module"` (dùng `import/export`)
- [ ] Cài thư viện:
  - Chạy: `express mysql2 dotenv cors helmet cookie-parser jsonwebtoken bcrypt joi express-rate-limit`
  - Dev: `nodemon`
- [ ] Thêm script: `"dev": "nodemon src/server.js"`, `"start": "node src/server.js"`
- [ ] Tạo cây thư mục `src/{config,routes,middlewares,validators,controllers,services,models,utils}`
- [ ] `.env.example`:
  ```
  PORT=3000
  CLIENT_URL=http://127.0.0.1:5500
  DB_HOST=localhost
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=
  DB_NAME=todopro
  JWT_SECRET=doi-thanh-chuoi-ngau-nhien-dai
  JWT_EXPIRES_IN=1d
  ```
- [ ] `config/env.js`: đọc `.env`, báo lỗi ngay nếu thiếu biến bắt buộc
- [ ] `utils/ApiError.js`: class lỗi có `statusCode`, `code`, `message`
- [ ] `utils/asyncHandler.js`: bọc controller async để lỗi tự chuyển sang error middleware
- [ ] `middlewares/error.middleware.js`: `notFound` (404) + `errorHandler` (trả JSON `{ success:false, error:{code,message} }`, không lộ stack trace khi production)
- [ ] `app.js`: `helmet()` → `cors({ origin: CLIENT_URL, credentials: true })` → `express.json()` → `cookieParser()` → `routes` → `notFound` → `errorHandler`
- [ ] `routes/index.js`: gom mọi route dưới `/api`, thêm `GET /api/health` trả `{ success: true }`
- [ ] `server.js`: import `app`, `listen(PORT)`

## Kết quả khi xong

- `npm run dev` chạy không lỗi
- `GET http://localhost:3000/api/health` → `{ "success": true }`
- `GET /api/abc` → 404 dạng JSON thống nhất

## Kiến thức nên hiểu

- Middleware chạy **theo thứ tự khai báo**. Error handler có **4 tham số** `(err, req, res, next)` và phải đặt **cuối cùng**.
