# Giai đoạn 6 — Giỏ hàng

**Mục tiêu:** Thêm gói vào giỏ, đổi số tháng, xóa, xem tổng tiền. Giỏ lưu trong bảng `cart_items`.

## Backend

| Lớp | File | Ghi chú |
|---|---|---|
| Route | `routes/cart.routes.js` | Toàn bộ route gắn `authenticate` |
| Validator | `validators/cart.validator.js` | `packageId` là số nguyên; `months` ∈ {1, 3, 6, 12} |
| Controller | `controllers/cart.controller.js` | `getCart`, `addItem`, `updateItem`, `removeItem` |
| Service | `services/cart.service.js` | Logic chính (xem bên dưới) |
| Model | `models/cart.model.js` | `findByUser` (JOIN packages), `upsert`, `updateMonths`, `delete`, `clearByUser` |

**Logic trong `cart.service.js`:**
- [ ] `addItem(userId, packageId, months)`: gói phải tồn tại và đang bán. Nếu gói đã có trong giỏ thì **cập nhật số tháng** (`INSERT ... ON DUPLICATE KEY UPDATE`)
- [ ] `getCart(userId)`: trả về `{ items: [{ id, package, months, unitPrice, subtotal }], totalAmount }`. **Giá tính từ bảng packages**
- [ ] `updateItem` / `removeItem`: kiểm tra dòng giỏ đó **thuộc về user đang đăng nhập**. Không thuộc về → 404 (không để user A xóa giỏ của user B)

## Frontend

- [ ] `js/api/cart.api.js`
- [ ] Landing: nút "Thêm vào giỏ" gọi API → toast "Đã thêm" → cập nhật số trên icon giỏ ở navbar
- [ ] `pages/cart.html` + `js/pages/cart.js`:
  - Gọi `requireLogin()` ở đầu trang
  - Danh sách gói, ô chọn số tháng (đổi là gọi PATCH), nút xóa
  - Tổng tiền, nút **"Tiến hành thanh toán"** → `checkout.html`
  - Giỏ trống: hiện ảnh `empty3.svg` (tái sử dụng từ app cũ) + nút "Xem các gói"

## Kết quả khi xong

- Thêm Gold 3 tháng, rồi thêm Gold 6 tháng: giỏ vẫn chỉ có 1 dòng Gold 6 tháng
- Dùng Postman gửi `packageId` không tồn tại → 404. Gửi `months: 5` → 400
- Đăng nhập máy khác (hoặc trình duyệt khác) thấy cùng giỏ hàng
