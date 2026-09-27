# Deploy TodoPro

Cách đơn giản và miễn phí (hoặc gần miễn phí): **1 dịch vụ Node.js trên Render** phục vụ cả API lẫn giao diện, kết hợp **MySQL trên cloud**.

Vì Frontend và Backend chạy chung một tên miền:
- Không cần cấu hình CORS
- Cookie đăng nhập hoạt động với `SameSite=Lax` như khi chạy trên máy

## 1. Tạo MySQL trên cloud

Chọn 1 trong các dịch vụ: **Aiven for MySQL** (gói free), **TiDB Cloud Serverless** (tương thích MySQL, free) hoặc **Railway** (MySQL).

Sau khi tạo xong, ghi lại: host, port, user, password, tên database. Nhiều dịch vụ bắt buộc kết nối SSL. Nếu gặp lỗi SSL, thêm tùy chọn `ssl` trong `backend/src/config/db.js`, ví dụ `ssl: { rejectUnauthorized: true }`.

Tạo bảng và dữ liệu từ máy của bạn, trỏ tới DB cloud:

```bash
cd backend
DB_HOST=... DB_PORT=... DB_USER=... DB_PASSWORD=... DB_NAME=... JWT_SECRET=x npm run db:setup
DB_HOST=... DB_PORT=... DB_USER=... DB_PASSWORD=... DB_NAME=... JWT_SECRET=x npm run db:seed-demo
```

## 2. Tạo Web Service trên Render

1. Đẩy code lên GitHub
2. Render → **New → Web Service** → chọn repo
3. Cấu hình:

| Mục | Giá trị |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm ci --omit=dev` |
| Start Command | `npm start` |

4. **Environment Variables:**

| Biến | Giá trị |
|---|---|
| `NODE_ENV` | `production` |
| `SERVE_FRONTEND` | `true` |
| `TRUST_PROXY` | `true` |
| `CLIENT_URL` | `https://<ten-app>.onrender.com` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | thông tin DB ở bước 1 |
| `JWT_SECRET` | chuỗi ngẫu nhiên dài (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `PAYMENT_MOCK_ENABLED` | `true` (giữ để nhà tuyển dụng thử nhanh) |
| `VNP_TMN_CODE`, `VNP_HASH_SECRET` | từ tài khoản VNPay sandbox |
| `VNP_RETURN_URL` | `https://<ten-app>.onrender.com/api/payments/vnpay/return` |

`Root Directory = backend` nhưng Express cần đọc thư mục `../frontend`. Render clone **cả repo** nên đường dẫn này vẫn tồn tại.

5. Deploy xong, mở `https://<ten-app>.onrender.com` và đăng nhập bằng `demo@todopro.vn / Demo@12345`.

## 3. VNPay IPN

Trong trang quản lý merchant sandbox, khai báo **IPN URL**: `https://<ten-app>.onrender.com/api/payments/vnpay/ipn`

Production **không** bật `VNP_CONFIRM_ON_RETURN`. Kết quả thanh toán chỉ được xác nhận qua IPN.

## Nếu tách Frontend và Backend ra 2 tên miền

Ví dụ Frontend trên Netlify và Backend trên Render. Khi đó cần thêm:
- `COOKIE_SAMESITE=none`. Cookie sẽ tự bật `Secure`, nên bắt buộc HTTPS
- `CLIENT_URL=https://<frontend>.netlify.app`
- Sửa `frontend/js/config.js` để `API_BASE_URL` trỏ tới địa chỉ Backend

Một số trình duyệt đang siết chặt cookie bên thứ ba. Vì vậy **khuyến nghị dùng cách 1 dịch vụ ở trên**.

## Checklist trước khi gửi link cho nhà tuyển dụng

- [ ] Mở trang trên điện thoại thật
- [ ] Đăng ký tài khoản mới → mua gói bằng thanh toán giả lập → dùng Todo App
- [ ] Đăng nhập tài khoản demo
- [ ] Thử thanh toán VNPay bằng thẻ test NCB: `9704198526191432198`, tên `NGUYEN VAN A`, ngày phát hành `07/15`, OTP `123456`. Thông tin thẻ test có thể thay đổi, hãy kiểm tra lại trong email VNPay gửi khi đăng ký sandbox
- [ ] Cập nhật link demo trong `README.md`
