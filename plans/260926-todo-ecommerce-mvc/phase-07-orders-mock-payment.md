# Giai đoạn 7 — Đơn hàng + thanh toán giả lập

**Mục tiêu:** Từ giỏ hàng tạo đơn → thanh toán giả lập → kích hoạt gói. **Hết giai đoạn này là đã có website e-commerce chạy trọn vẹn.**

## Luồng

```
cart.html ──"Tiến hành thanh toán"──> checkout.html
   hiện tóm tắt giỏ, chọn phương thức [Giả lập | VNPay (giai đoạn 9)]
   ──"Đặt hàng"──> POST /api/orders          → đơn status = pending
   ──────────────> POST /api/payments/mock/:id → đơn status = paid
                                                + tạo subscriptions
                                                + xóa giỏ
   ──> payment-result.html?orderId=..&status=success
```

## Backend

| Lớp | File | Ghi chú |
|---|---|---|
| Route | `routes/order.routes.js`, `routes/payment.routes.js` | Gắn `authenticate` |
| Controller | `order.controller.js`, `payment.controller.js` | |
| Service | `order.service.js` | `createFromCart`, `listByUser`, `getDetail` |
| Service | `subscription.service.js` | `activateFromOrder(order)`, `getCurrentPlan(userId)` |
| Service | `payment/mock.service.js` | `pay(orderId, userId)` |
| Model | `order.model.js`, `order-item.model.js`, `payment.model.js`, `subscription.model.js` | |

**Việc cần làm:**
- [x] `createFromCart(userId)`:
  - Giỏ trống → 400 `CART_EMPTY`
  - Tạo `order_code` dễ đọc (vd `TD20260926-000123`)
  - Chèn `orders` + `order_items` (**lưu tên và giá gói tại thời điểm mua**) trong **1 transaction**
- [x] `mock.service.pay()`: trong 1 transaction:
  1. Khóa đơn `SELECT ... FOR UPDATE`, kiểm tra đơn của đúng user và status = `pending` (đã paid → 409)
  2. Cập nhật `orders.status = 'paid'`, `paid_at = NOW()`
  3. Ghi 1 dòng vào `payments` (provider = `mock`)
  4. `subscription.activateFromOrder`: mỗi order_item tạo 1 subscription. `start_at` = thời điểm hết hạn gói cùng loại đang còn hạn (nếu có), nếu không thì NOW(). `end_at` = start_at + `months` tháng
  5. Xóa giỏ hàng
- [x] `getCurrentPlan(userId)`: gói có `tier` cao nhất mà `end_at > NOW()`. Bổ sung kết quả này vào API `/auth/me`
- [x] `GET /orders/:id` chỉ trả về đơn của chính user

## Frontend

- [x] `pages/checkout.html` + `checkout.js`: tóm tắt đơn, chọn phương thức, nút "Đặt hàng và thanh toán"
- [x] `pages/payment-result.html` + `payment-result.js`: đọc `orderId` trên URL → gọi API lấy chi tiết đơn → hiện kết quả thành công/thất bại + nút "Dùng Todo App ngay" / "Thử lại"
- [x] `pages/orders.html` + `orders.js`: bảng lịch sử đơn (mã đơn, ngày, tổng tiền, trạng thái có màu)
- [x] Navbar hiện huy hiệu gói đang dùng (Basic/Gold/Pro)

## Kết quả khi xong

- Luồng đầy đủ: đăng ký → thêm gói → thanh toán giả lập → thấy đơn `paid`, giỏ trống, navbar hiện gói
- Gọi API thanh toán 2 lần cho cùng 1 đơn → lần 2 nhận 409, không tạo thêm subscription
- **Khuyến nghị:** commit và gắn tag `v1.0-mvp`

## Ghi chú khi thực hiện (2026-09-26)

- `config/db.js` thêm `withTransaction()`; model nhận `conn` làm tham số cuối để chạy trong transaction
- Mã đơn `TD` + yymmdd + 6 ký tự (bỏ 0/O/1/I/L dễ nhầm), chỉ chữ + số để hợp lệ với VNPay
- `orderService.markPaid()` dùng chung cho mock và VNPay: paid → tạo subscription → xóa các gói **vừa mua** khỏi giỏ
- Subscription tính thời gian hoàn toàn bằng SQL (`GREATEST(NOW(), MAX(end_at))`, `DATE_ADD`) để không lệch múi giờ giữa Node và MySQL
- Frontend: `utils/payment-flow.js` (`startPayment`) dùng chung cho trang Thanh toán, Kết quả, Đơn hàng. Đơn pending có nút "Thanh toán" để thử lại
- Đã kiểm tra: 3 request thanh toán cùng lúc → 200/409/409, chỉ 1 subscription; mua thêm Gold khi còn hạn → nối tiếp đúng ngày
