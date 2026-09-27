# API — TodoPro

Base URL: `http://localhost:3000/api` · Dữ liệu gửi/nhận dạng JSON · Đăng nhập bằng cookie `token` (httpOnly), trình duyệt tự gửi kèm khi gọi `fetch(..., { credentials: 'include' })`.

Collection Postman: [`docs/postman/`](postman/). Trong Postman bấm **Import** rồi kéo thả 2 file vào.

## Định dạng phản hồi

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "CART_ITEM_NOT_FOUND", "message": "Không tìm thấy mục trong giỏ" } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Dữ liệu không hợp lệ",
  "details": [{ "field": "email", "message": "Email không hợp lệ" }] } }
```

Ngoại lệ: 2 route VNPay (`/payments/vnpay/return`, `/payments/vnpay/ipn`) trả về theo định dạng VNPay quy định.

## Danh sách endpoint

🔒 = cần đăng nhập · 📦 = cần gói còn hạn

### Xác thực

| Method | URL | Body | Kết quả |
|---|---|---|---|
| POST | `/auth/register` | `{ fullName, email, password }` | 201 `{ user }` + cookie (đăng nhập luôn) · 409 `EMAIL_TAKEN` |
| POST | `/auth/login` | `{ email, password }` | 200 `{ user }` + cookie · 401 `INVALID_CREDENTIALS` · 429 `TOO_MANY_ATTEMPTS` (5 lần sai / 15 phút) |
| POST | `/auth/logout` | — | 200, xóa cookie |
| GET | `/auth/me` 🔒 | — | `{ user, currentPlan, cartCount }` |

Mật khẩu: 8–72 ký tự, có cả chữ và số.

### Gói

| Method | URL | Kết quả |
|---|---|---|
| GET | `/packages` | `{ packages: [{ id, code, name, description, pricePerMonth, maxTasks, tier, features }] }` |
| GET | `/packages/:code` | `{ package }` · 404 `PACKAGE_NOT_FOUND` |

### Giỏ hàng 🔒

Mọi endpoint trả về giỏ hàng mới nhất: `{ cart: { items: [{ id, months, package, unitPrice, subtotal }], itemCount, totalAmount } }`

| Method | URL | Body | Ghi chú |
|---|---|---|---|
| GET | `/cart` | — | |
| POST | `/cart/items` | `{ packageId, months }` | `months` ∈ 1, 3, 6, 12. Gói đã có trong giỏ → cập nhật số tháng |
| PATCH | `/cart/items/:id` | `{ months }` | 404 nếu không phải giỏ của mình |
| DELETE | `/cart/items/:id` | — | |

### Đơn hàng 🔒

| Method | URL | Body | Kết quả |
|---|---|---|---|
| POST | `/orders` | `{ paymentMethod: "mock" \| "vnpay" }` | 201 `{ order }` (status `pending`) · 400 `CART_EMPTY` · 400 `PAYMENT_METHOD_DISABLED` |
| GET | `/orders` | — | `{ orders }` mới nhất trước (tối đa 50) |
| GET | `/orders/:id` | — | `{ order }` · 404 nếu không phải đơn của mình |

`order = { id, orderCode, status, paymentMethod, totalAmount, createdAt, paidAt, items: [{ packageName, unitPrice, months, subtotal }] }`. `status` ∈ `pending | paid | failed | cancelled`.

### Thanh toán

| Method | URL | Kết quả |
|---|---|---|
| GET | `/payments/methods` | `{ methods: [{ code, name, enabled }] }` |
| POST | `/payments/mock/:orderId` 🔒 | `{ order }` (paid) · 409 `ORDER_ALREADY_PAID` · 400 `PAYMENT_METHOD_MISMATCH` |
| POST | `/payments/vnpay/:orderId` 🔒 | `{ paymentUrl }` → Frontend chuyển trình duyệt sang VNPay |
| GET | `/payments/vnpay/return` | VNPay đưa người dùng quay về → 302 sang `/pages/payment-result.html?orderId=…` |
| GET | `/payments/vnpay/ipn` | VNPay báo kết quả cho server → `{ RspCode, Message }` |

Mã IPN: `00` thành công · `01` không tìm thấy đơn · `02` đơn đã xử lý · `04` sai số tiền · `97` sai chữ ký · `99` lỗi khác.

Khi thanh toán thành công (mock hoặc IPN), trong **1 transaction**: đơn → `paid`, tạo `subscriptions` (nối tiếp nếu gói còn hạn), xóa các gói đã mua khỏi giỏ.

### Todo 🔒 📦

| Method | URL | Body | Kết quả |
|---|---|---|---|
| GET | `/todos` | — | `{ todos, plan, limits: { maxTasks, canEdit } }` |
| POST | `/todos` | `{ text }` (1–200 ký tự) | 201 `{ todo }` · 403 `TASK_LIMIT_REACHED` |
| PATCH | `/todos/:id` | `{ text?, completed? }` | 403 `FEATURE_NOT_AVAILABLE` (Basic sửa nội dung) · 409 `TODO_COMPLETED` |
| DELETE | `/todos/:id` | — | |

Chưa có gói còn hạn → 403 `SUBSCRIPTION_REQUIRED`.

## Mã lỗi chung

| HTTP | code | Khi nào |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Dữ liệu sai, có `details` cho từng ô |
| 400 | `INVALID_JSON` | Body không phải JSON hợp lệ |
| 401 | `UNAUTHENTICATED` | Chưa đăng nhập / token hết hạn |
| 404 | `NOT_FOUND` | Sai URL |
| 500 | `INTERNAL_ERROR` | Lỗi không lường trước (production không lộ chi tiết) |
