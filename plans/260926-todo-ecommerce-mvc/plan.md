---
title: "Nâng cấp Todo List thành website bán gói Todo (E-commerce, MVC)"
status: in-progress
priority: P1
created: 2026-09-26
stack: "Frontend HTML/CSS/JS thuần · Backend Node.js + Express · MySQL · VNPay sandbox"
blockedBy: []
blocks: []
---

# Kế hoạch: TodoPro — Website bán gói Todo List

## 1. Ý tưởng (viết lại cho rõ)

Biến ứng dụng Todo List hiện tại thành **một sản phẩm có bán gói dịch vụ**, giống cách các ứng dụng SaaS (Notion, Todoist...) bán gói Free/Pro.

| # | Chức năng | Mô tả dễ hiểu |
|---|---|---|
| 1 | **Trang chủ (Landing page)** | Giới thiệu sản phẩm, so sánh 3 gói **Basic / Gold / Pro** (giá, tính năng), nút "Thêm vào giỏ" |
| 2 | **Đăng ký / Đăng nhập / Đăng xuất** | Tạo tài khoản bằng email + mật khẩu. Mật khẩu được mã hóa trước khi lưu |
| 3 | **Giỏ hàng** | Thêm gói vào giỏ, chọn số tháng, xóa gói, xem tổng tiền. Giỏ hàng lưu trong CSDL (đăng nhập máy khác vẫn còn) |
| 4 | **Thanh toán** | Tạo đơn hàng từ giỏ → thanh toán (giai đoạn 1: giả lập; giai đoạn 2: VNPay sandbox) → xem kết quả |
| 5 | **Lịch sử đơn hàng** | Xem các đơn đã mua và trạng thái |
| 6 | **Ứng dụng Todo (sau khi mua)** | Mua gói xong thì được dùng Todo App. Mỗi gói giới hạn khác nhau (Basic 20 việc, Gold 100 việc, Pro không giới hạn). Todo lưu vào CSDL thay vì localStorage |

> **Vì sao thêm mục 6?** Nếu mua gói mà không nhận được gì thì sản phẩm không có ý nghĩa. Mục 6 tái sử dụng code Todo bạn đã viết, và thể hiện được **phân quyền theo gói** (một điểm cộng khi phỏng vấn).

### Quy tắc nghiệp vụ

- Phải **đăng nhập** mới thêm được vào giỏ. Nếu chưa đăng nhập thì chuyển sang trang đăng nhập, xong quay lại trang cũ.
- Mỗi gói chỉ xuất hiện **1 dòng** trong giỏ. Người dùng chọn **số tháng** (1, 3, 6, 12). Thêm lại gói đã có thì cập nhật số tháng, không tạo dòng mới.
- **Giá luôn do Backend tính** từ CSDL. Không bao giờ tin giá Frontend gửi lên.
- Khi đơn hàng **thanh toán thành công**: tạo `subscription` (thời hạn sử dụng) và xóa giỏ hàng.
- Gói đang dùng của người dùng = **gói cao nhất còn hạn**.

## 2. Công nghệ đã chọn

| Phần | Công nghệ | Ghi chú |
|---|---|---|
| Frontend | HTML, CSS, JavaScript thuần (ES Modules) | Mỗi trang 1 file HTML. Gọi API bằng `fetch` |
| Backend | Node.js + Express | Kiến trúc nhiều lớp: route → middleware → controller → service → model |
| Database | MySQL 8 + thư viện `mysql2` | Tự viết câu SQL trong lớp model (thể hiện kỹ năng SQL, dễ hiểu từng lớp) |
| Xác thực | JWT lưu trong **cookie httpOnly** + `bcrypt` mã hóa mật khẩu | Cookie httpOnly an toàn hơn localStorage (JS độc hại không đọc được token) |
| Kiểm tra dữ liệu | `joi` | Kiểm tra dữ liệu gửi lên trong middleware `validate` |
| Bảo mật | `helmet`, `cors`, `express-rate-limit` | Giới hạn số lần thử đăng nhập |
| Thanh toán | Giả lập → **VNPay sandbox** | Sandbox = môi trường thử, không mất tiền thật |
| Công cụ | `nodemon`, `dotenv`, VS Code Live Server | |

## 3. Luồng xử lý một yêu cầu (FE → BE → FE)

```
FRONTEND (trình duyệt)
  js/pages/cart.js ──gọi──> js/api/cart.api.js ──fetch──> POST /api/cart/items
                                                              │
BACKEND                                                       ▼
  ① routes/cart.routes.js       Xác định URL + method nào thì gọi ai
  ② middlewares/                Các lớp kiểm tra, chạy lần lượt:
       authenticate               - Đã đăng nhập chưa? (đọc JWT từ cookie)
       validate(addItemSchema)    - Dữ liệu gửi lên đúng định dạng chưa?
  ③ controllers/cart.controller.js   Lấy dữ liệu từ req, gọi service, trả JSON
  ④ services/cart.service.js         LOGIC NGHIỆP VỤ: gói có tồn tại? đã có trong giỏ? tính tiền
  ⑤ models/cart.model.js             Chỉ chạy câu SQL, không chứa logic
  ⑥ MySQL                            Lưu / đọc dữ liệu
                                                              │
  Chiều về:  DB → model → service → controller ──JSON──> FE   ▼
  Nếu có lỗi ở bất kỳ bước nào → middlewares/error.middleware.js trả JSON lỗi thống nhất
                                                              │
FRONTEND                                                      ▼
  cart.js nhận JSON → vẽ lại giỏ hàng + hiện thông báo (toast)
```

**Mỗi lớp chỉ làm một việc:**

| Lớp | Được làm | Không được làm |
|---|---|---|
| Route | Khai báo URL, gắn middleware, gắn controller | Viết logic |
| Middleware | Kiểm tra đăng nhập, dữ liệu, quyền, bắt lỗi | Truy vấn nghiệp vụ phức tạp |
| Controller | Đọc `req`, gọi service, trả `res` | Viết SQL, tính toán nghiệp vụ |
| Service | Toàn bộ logic nghiệp vụ, ném lỗi `ApiError` | Đụng tới `req`/`res` |
| Model | Câu SQL | Logic nghiệp vụ |

Định dạng phản hồi thống nhất:
```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": { "code": "CART_ITEM_NOT_FOUND", "message": "..." } }
```

## 4. Cấu trúc thư mục mục tiêu

```
todo-list/
├── frontend/
│   ├── index.html                  # Landing page
│   ├── pages/
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── cart.html
│   │   ├── checkout.html           # Xác nhận đơn + chọn phương thức thanh toán
│   │   ├── payment-result.html     # Thành công / thất bại
│   │   ├── orders.html             # Lịch sử đơn hàng
│   │   └── app.html                # Todo App (cần có gói)
│   ├── css/
│   │   ├── base.css                # Biến màu, font, reset
│   │   ├── components.css          # Nút, card, form, navbar, toast
│   │   └── pages/                  # landing.css, auth.css, cart.css, todo.css ...
│   ├── js/
│   │   ├── api/                    # Chỉ gọi API — http.js, auth.api.js, package.api.js, cart.api.js, order.api.js, todo.api.js
│   │   ├── components/             # navbar.js, toast.js, package-card.js
│   │   ├── utils/                  # auth-guard.js, format-currency.js
│   │   └── pages/                  # Mỗi trang 1 file: landing.js, login.js, cart.js ...
│   └── assets/images/              # Chuyển từ image/ sang
│
├── backend/
│   ├── src/
│   │   ├── config/                 # db.js (pool MySQL), env.js
│   │   ├── routes/                 # index.js + *.routes.js
│   │   ├── middlewares/            # auth, validate, subscription, rate-limit, error
│   │   ├── validators/             # Schema joi cho từng chức năng
│   │   ├── controllers/            # *.controller.js
│   │   ├── services/               # *.service.js (+ payment/vnpay.service.js)
│   │   ├── models/                 # *.model.js
│   │   ├── utils/                  # ApiError.js, jwt.js
│   │   ├── app.js                  # Cấu hình express + middleware chung
│   │   └── server.js               # Khởi động server
│   ├── database/
│   │   ├── schema.sql              # Tạo bảng
│   │   └── seed.sql                # Dữ liệu 3 gói Basic/Gold/Pro
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── docs/                           # Tài liệu API, sơ đồ CSDL (cho CV)
├── plans/                          # Kế hoạch này
└── README.md                       # Giới thiệu dự án, ảnh chụp, cách chạy
```

Mỗi chức năng (auth, package, cart, order, payment, todo) có **đủ 1 bộ file riêng** ở mỗi lớp. Ví dụ `cart.routes.js` → `cart.controller.js` → `cart.service.js` → `cart.model.js`. Nhờ vậy các chức năng tách biệt, không lẫn vào nhau.

## 5. Thiết kế cơ sở dữ liệu

```
users ───< cart_items >─── packages
  │                          │
  ├───< orders ───< order_items
  │        │
  │        └───< payments
  ├───< subscriptions >── packages
  └───< todos
```

| Bảng | Cột chính | Ghi chú |
|---|---|---|
| `users` | id, full_name, email (UNIQUE), password_hash, created_at | |
| `packages` | id, code (`basic`/`gold`/`pro`), name, description, price_per_month (INT, VND), max_tasks (NULL = không giới hạn), features (JSON), tier (1/2/3), is_active | `tier` dùng để so sánh gói cao/thấp |
| `cart_items` | id, user_id, package_id, months, created_at | UNIQUE(user_id, package_id) |
| `orders` | id, user_id, order_code (UNIQUE), total_amount, status (`pending`/`paid`/`failed`/`cancelled`), payment_method (`mock`/`vnpay`), created_at, paid_at | |
| `order_items` | id, order_id, package_id, package_name, unit_price, months, subtotal | **Lưu lại giá lúc mua**, để sau này đổi giá gói thì đơn cũ không bị sai |
| `payments` | id, order_id, provider, transaction_ref, amount, status, raw_response (JSON), created_at | Lưu kết quả VNPay trả về để đối soát |
| `subscriptions` | id, user_id, package_id, order_id, start_at, end_at | |
| `todos` | id, user_id, text, completed, created_at | Thay cho localStorage |

Giá gói đề xuất (sửa tùy ý trong `seed.sql`):

| Gói | Giá/tháng | Số việc tối đa | Tính năng thêm |
|---|---|---|---|
| Basic | 29.000đ | 20 | Todo cơ bản, thanh tiến độ |
| Gold | 59.000đ | 100 | + Sửa việc, pháo giấy khi hoàn thành |
| Pro | 99.000đ | Không giới hạn | + Tất cả tính năng |

## 6. Danh sách API

| Method | URL | Middleware | Chức năng |
|---|---|---|---|
| POST | `/api/auth/register` | validate | Đăng ký |
| POST | `/api/auth/login` | rateLimit, validate | Đăng nhập, gắn cookie JWT |
| POST | `/api/auth/logout` | — | Xóa cookie |
| GET | `/api/auth/me` | authenticate | Thông tin người dùng + gói đang dùng |
| GET | `/api/packages` | — | Danh sách gói (landing page) |
| GET | `/api/packages/:code` | — | Chi tiết 1 gói |
| GET | `/api/cart` | authenticate | Xem giỏ + tổng tiền |
| POST | `/api/cart/items` | authenticate, validate | Thêm gói / cập nhật số tháng |
| PATCH | `/api/cart/items/:id` | authenticate, validate | Đổi số tháng |
| DELETE | `/api/cart/items/:id` | authenticate | Xóa khỏi giỏ |
| POST | `/api/orders` | authenticate, validate | Tạo đơn từ giỏ (status = pending) |
| GET | `/api/orders` | authenticate | Lịch sử đơn |
| GET | `/api/orders/:id` | authenticate | Chi tiết đơn (chỉ xem được đơn của mình) |
| POST | `/api/payments/mock/:orderId` | authenticate | Thanh toán giả lập |
| POST | `/api/payments/vnpay/:orderId` | authenticate | Tạo URL thanh toán VNPay |
| GET | `/api/payments/vnpay/return` | — | VNPay chuyển người dùng về |
| GET | `/api/payments/vnpay/ipn` | — | VNPay báo kết quả cho server (nguồn tin cậy) |
| GET/POST/PATCH/DELETE | `/api/todos...` | authenticate, requireSubscription | CRUD todo, kiểm tra giới hạn theo gói |

## 7. Các giai đoạn thực hiện

Làm **theo thứ tự**. Xong giai đoạn nào thì chạy thử được giai đoạn đó.

| # | Giai đoạn | File chi tiết | Trạng thái |
|---|---|---|---|
| 0 | Chuẩn bị & tái cấu trúc thư mục | [phase-00](phase-00-preparation.md) | ✅ |
| 1 | Dựng khung Backend (Express + MVC) | [phase-01](phase-01-backend-skeleton.md) | ✅ |
| 2 | Cơ sở dữ liệu MySQL | [phase-02](phase-02-database.md) | ✅ |
| 3 | Đăng ký / Đăng nhập (Backend) | [phase-03](phase-03-auth-backend.md) | ✅ |
| 4 | Nền tảng Frontend + trang Đăng nhập/Đăng ký | [phase-04](phase-04-frontend-foundation.md) | ⬜ |
| 5 | Landing page + API gói | [phase-05](phase-05-landing-packages.md) | ⬜ |
| 6 | Giỏ hàng | [phase-06](phase-06-cart.md) | ⬜ |
| 7 | Đơn hàng + thanh toán giả lập | [phase-07](phase-07-orders-mock-payment.md) | ⬜ |
| 8 | Todo App theo gói | [phase-08](phase-08-todo-app.md) | ⬜ |
| 9 | Tích hợp VNPay sandbox | [phase-09](phase-09-vnpay.md) | ⬜ |
| 10 | Test, tài liệu, deploy, đưa vào CV | [phase-10](phase-10-polish-deploy.md) | ⬜ |

**Mốc quan trọng:** hết giai đoạn 7 là đã có một website e-commerce **chạy trọn vẹn** (đăng ký → xem gói → giỏ → thanh toán). Giai đoạn 8 đến 10 giúp dự án nổi bật hơn trên CV.

## 8. Rủi ro & lưu ý

| Rủi ro | Cách xử lý |
|---|---|
| Frontend (cổng 5500) và Backend (cổng 3000) khác cổng, cookie không được gửi | Cấu hình `cors({ origin, credentials: true })`. FE gọi `fetch(..., { credentials: 'include' })`. Cookie `sameSite: 'lax'` |
| Lỗi XSS: code cũ dùng `innerHTML` với chữ người dùng nhập | Dùng `textContent` hoặc hàm escape khi hiển thị dữ liệu người dùng |
| Người dùng sửa giá trong request | Backend luôn lấy giá từ bảng `packages` |
| VNPay báo kết quả giả mạo | Kiểm tra chữ ký `vnp_SecureHash`. Chỉ tin kết quả từ IPN. Kiểm tra số tiền khớp đơn |
| Thanh toán 2 lần cho 1 đơn | Chỉ xử lý đơn đang `pending`, dùng transaction MySQL |
| Lộ mật khẩu DB / secret | Để trong `.env`, thêm `.env` vào `.gitignore`, chỉ commit `.env.example` |
| `CLAUDE.md` đang ghi stack React/Next.js | Sửa lại ở giai đoạn 0 để AI không đề xuất sai công nghệ |

## 9. Ngoài phạm vi (chưa làm, có thể thêm sau)

Quên mật khẩu qua email, đăng nhập Google, trang admin quản lý gói, mã giảm giá, refresh token, tự động gia hạn gói.
