# Giai đoạn 0 — Chuẩn bị & tái cấu trúc thư mục

**Mục tiêu:** Cài đủ công cụ, tách code cũ vào `frontend/`, tạo nhánh git riêng để làm an toàn.

## Việc cần làm

- [x] Cài **Node.js LTS** (kiểm tra: `node -v`, `npm -v`)
- [x] Cài **MySQL 8** + một công cụ xem CSDL (MySQL Workbench, DBeaver hoặc HeidiSQL)
- [ ] Cài extension VS Code: **Live Server**, **REST Client** (hoặc dùng Postman) để thử API
- [ ] Commit trạng thái hiện tại, rồi tạo nhánh mới:
      `git checkout -b feature/ecommerce`
- [x] Tạo 2 thư mục `frontend/` và `backend/`
- [x] Chuyển code cũ vào frontend (dùng `git mv` để giữ lịch sử):
  - `index.html`, `style.css`, `script.js` → tạm để ở `frontend/legacy/` (giai đoạn 8 sẽ tái sử dụng)
  - `image/` → `frontend/assets/images/`
- [x] ~~Xóa ảnh không dùng~~ → quyết định giữ lại tất cả (xem lại ở giai đoạn 10)
- [x] Tạo `.gitignore` ở gốc: `node_modules/`, `.env`, `*.log`
- [x] Sửa `CLAUDE.md`: ghi rõ stack thật (HTML/CSS/JS thuần + Express + MySQL) và cấu trúc `frontend/` + `backend/`
- [x] Quyết định: **có commit** `.claude/` (hỏi lại người dùng trước khi commit)

## Kết quả khi xong

- `git status` sạch, đang ở nhánh `feature/ecommerce`
- Mở `frontend/legacy/index.html` bằng Live Server, app Todo cũ vẫn chạy (sửa lại đường dẫn ảnh nếu cần)

## Lưu ý

- Không xóa code Todo cũ, vì giai đoạn 8 sẽ dùng lại logic của nó.
