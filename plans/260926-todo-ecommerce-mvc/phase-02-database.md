# Giai đoạn 2 — Cơ sở dữ liệu MySQL

**Mục tiêu:** Có đủ bảng theo thiết kế ở `plan.md` mục 5, có dữ liệu 3 gói, và backend kết nối được.

## Việc cần làm

- [ ] Viết `backend/database/schema.sql`:
  - `CREATE DATABASE IF NOT EXISTS todopro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` (utf8mb4 để lưu tiếng Việt và emoji)
  - Tạo 8 bảng: `users`, `packages`, `cart_items`, `orders`, `order_items`, `payments`, `subscriptions`, `todos`
  - Khóa ngoại (`FOREIGN KEY`) + `ON DELETE CASCADE` hợp lý (xóa user thì xóa cart_items và todos)
  - Ràng buộc: `UNIQUE(email)`, `UNIQUE(user_id, package_id)` cho `cart_items`, `UNIQUE(order_code)`
  - Index cho các cột hay tìm kiếm: `orders.user_id`, `subscriptions(user_id, end_at)`, `todos.user_id`
  - Tiền lưu kiểu `INT UNSIGNED` (đơn vị đồng), **không dùng FLOAT**
- [ ] Viết `backend/database/seed.sql`: chèn 3 gói Basic/Gold/Pro (giá, `max_tasks`, `tier`, `features` JSON)
- [ ] Chạy 2 file SQL trong MySQL Workbench/DBeaver
- [ ] `config/db.js`: tạo **connection pool** bằng `mysql2/promise`, export `pool`
- [ ] Trong `server.js`: thử `pool.query('SELECT 1')` trước khi `listen`. Lỗi thì in thông báo rõ ràng rồi thoát
- [ ] Vẽ sơ đồ ERD (dùng dbdiagram.io hoặc tính năng "Reverse Engineer" của MySQL Workbench), lưu ảnh vào `docs/`

## Kết quả khi xong

- 8 bảng hiện trong công cụ quản lý CSDL, bảng `packages` có 3 dòng
- Server khởi động in ra "Database connected"

## Lưu ý

- Luôn dùng **câu lệnh có tham số** `pool.execute('... WHERE id = ?', [id])`, **không cộng chuỗi SQL**, để tránh lỗi SQL Injection.
