# Giai đoạn 1 — Dựng khung Backend (Express + MVC)

**Mục tiêu:** Server Express chạy được, có đủ các lớp thư mục, có cách xử lý lỗi thống nhất. Chưa có chức năng thật.

## Việc cần làm

- [x] `cd backend && npm init -y`, trong `package.json` đặt `"type": "module"` (dùng `import/export`)
- [x] Cài thư viện:
  - Chạy: `express mysql2 dotenv cors helmet cookie-parser jsonwebtoken bcrypt joi express-rate-limit`
  - Dev: `nodemon`
- [x] Thêm script: `"dev": "nodemon src/server.js"`, `"start": "node src/server.js"`
- [x] Tạo cây thư mục `src/{config,routes,middlewares,validators,controllers,services,models,utils}`
- [x] `.env.example`:
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
- [x] `config/env.js`: đọc `.env`, báo lỗi ngay nếu thiếu biến bắt buộc
- [x] `utils/ApiError.js`: class lỗi có `statusCode`, `code`, `message`
- [x] ~~`utils/asyncHandler.js`~~ → **bỏ**: Express 5 tự chuyển lỗi của hàm async sang error middleware
- [x] `middlewares/error.middleware.js`: `notFound` (404) + `errorHandler` (trả JSON `{ success:false, error:{code,message} }`, không lộ stack trace khi production)
- [x] `app.js`: `helmet()` → `cors({ origin: CLIENT_URL, credentials: true })` → `express.json()` → `cookieParser()` → `routes` → `notFound` → `errorHandler`
- [x] `routes/index.js`: gom mọi route dưới `/api`, thêm `GET /api/health` trả `{ success: true }`
- [x] `server.js`: import `app`, `listen(PORT)`

## Kết quả khi xong

- `npm run dev` chạy không lỗi
- `GET http://localhost:3000/api/health` → `{ "success": true }`
- `GET /api/abc` → 404 dạng JSON thống nhất

## Kiến thức nên hiểu

- Middleware chạy **theo thứ tự khai báo**. Error handler có **4 tham số** `(err, req, res, next)` và phải đặt **cuối cùng**.

## Ghi chú khi thực hiện (2026-09-26)

- Cài được **Express 5.2**. Express 5 tự bắt lỗi `throw` trong hàm `async` nên không cần `asyncHandler`
- Thêm `requests/health.http` để thử API bằng REST Client
- `.env` được tạo từ `.env.example` với `JWT_SECRET` ngẫu nhiên. `DB_PASSWORD` sẽ điền ở giai đoạn 2
- Đã kiểm tra: health 200, route lạ 404 JSON, JSON sai 400 `INVALID_JSON`, CORS cho `127.0.0.1:5500`, thiếu biến môi trường thì dừng server
