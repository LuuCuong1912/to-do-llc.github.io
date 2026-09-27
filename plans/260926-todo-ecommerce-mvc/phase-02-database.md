# Giai đoạn 2 — Cơ sở dữ liệu MySQL

**Mục tiêu:** Có đủ bảng theo thiết kế ở `plan.md` mục 5, có dữ liệu 3 gói, và backend kết nối được.

## Việc cần làm

- [x] Viết `backend/database/schema.sql`:
  - `CREATE DATABASE IF NOT EXISTS todopro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` (utf8mb4 để lưu tiếng Việt và emoji)
  - Tạo 8 bảng: `users`, `packages`, `cart_items`, `orders`, `order_items`, `payments`, `subscriptions`, `todos`
  - Khóa ngoại (`FOREIGN KEY`) + `ON DELETE CASCADE` hợp lý (xóa user thì xóa cart_items và todos)
  - Ràng buộc: `UNIQUE(email)`, `UNIQUE(user_id, package_id)` cho `cart_items`, `UNIQUE(order_code)`
  - Index cho các cột hay tìm kiếm: `orders.user_id`, `subscriptions(user_id, end_at)`, `todos.user_id`
  - Tiền lưu kiểu `INT UNSIGNED` (đơn vị đồng), **không dùng FLOAT**
- [x] Viết `backend/database/seed.sql`: chèn 3 gói Basic/Gold/Pro (giá, `max_tasks`, `tier`, `features` JSON)
- [x] Chạy 2 file SQL trong MySQL Workbench/DBeaver
- [x] `config/db.js`: tạo **connection pool** bằng `mysql2/promise`, export `pool`
- [x] Trong `server.js`: thử `pool.query('SELECT 1')` trước khi `listen`. Lỗi thì in thông báo rõ ràng rồi thoát
- [x] Vẽ sơ đồ ERD (dùng dbdiagram.io hoặc tính năng "Reverse Engineer" của MySQL Workbench), lưu ảnh vào `docs/`

## Kết quả khi xong

- 8 bảng hiện trong công cụ quản lý CSDL, bảng `packages` có 3 dòng
- Server khởi động in ra "Database connected"

## Lưu ý

- Luôn dùng **câu lệnh có tham số** `pool.execute('... WHERE id = ?', [id])`, **không cộng chuỗi SQL**, để tránh lỗi SQL Injection.

## Ghi chú khi thực hiện (2026-09-26)

- **User MySQL riêng `todopro`** (chỉ có quyền trên database `todopro`), không dùng `root`
- `schema.sql` **không** chứa `CREATE DATABASE`. Script `database/setup.js` tự tạo database theo `DB_NAME` rồi chạy `schema.sql` và `seed.sql`
  - `npm run db:setup`: chạy lại nhiều lần vẫn an toàn (`CREATE TABLE IF NOT EXISTS`, seed dùng `ON DUPLICATE KEY UPDATE`)
  - `npm run db:reset`: xóa và tạo lại, bị chặn khi `NODE_ENV=production`
- ERD vẽ bằng **Mermaid** trong `docs/database.md` (GitHub tự hiển thị thành hình), không dùng ảnh
- Thêm `CHECK (months IN (1,3,6,12))` cho `cart_items`, `UNIQUE(tier)` cho `packages`, `UNIQUE(provider, transaction_ref)` cho `payments`
- Đã kiểm tra: 8 bảng + 3 gói; tiếng Việt + emoji lưu đúng; chặn được email trùng, months sai, package không tồn tại, gói trùng trong giỏ; `features` đọc ra thành mảng JS; server in "Database connected"
