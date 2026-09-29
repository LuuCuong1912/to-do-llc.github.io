# Deploy TodoPro

**Cách khuyến nghị (miễn phí, không cần thẻ tín dụng):**

| Phần | Dịch vụ | Ghi chú gói miễn phí |
|---|---|---|
| App | **Render**, Web Service chạy bằng `Dockerfile` có sẵn | Tự "ngủ" sau 15 phút không có truy cập; lần vào sau chờ ~30–60 giây. 750 giờ/tháng |
| Database | **Aiven for MySQL** (Free) | 1 GB, không giới hạn thời gian, tự tắt khi lâu không dùng. **Bắt buộc SSL** |

Express phục vụ cả API lẫn giao diện trên **cùng một tên miền** (`SERVE_FRONTEND=true` đã đặt sẵn trong `Dockerfile`), nên không cần cấu hình CORS và cookie đăng nhập dùng `SameSite=Lax` như trên máy.

Muốn chạy thử trên máy trước: `docker compose up --build`, rồi mở http://localhost:8080 (xem README).

---

## Bước 1: Tạo MySQL trên Aiven

1. Đăng ký tại [aiven.io](https://aiven.io), tạo service **MySQL**, chọn gói **Free**, chọn vùng gần Việt Nam (ví dụ Singapore)
2. Chờ trạng thái **Running**, mở tab **Overview → Connection information** và ghi lại:
   - **Host**, **Port**, **User** (thường là `avnadmin`), **Password**
   - **CA certificate**: bấm *Show* / *Download* để lấy file `ca.pem`
3. Không cần tạo bảng bằng tay. App tự chạy `setup.js` (tạo database `todopro`, bảng, 3 gói) và `seed-demo.js` (tài khoản demo) mỗi lần khởi động. Hai script này chạy lại nhiều lần vẫn an toàn

## Bước 2: Tạo Web Service trên Render

1. Đăng ký tại [render.com](https://render.com) bằng tài khoản GitHub
2. **New → Web Service** → chọn repo → nhánh `main`
3. **Language / Runtime: Docker**. Render tự nhận `Dockerfile` ở thư mục gốc. Để trống *Root Directory*
4. **Instance type: Free**
5. **Environment Variables**:

| Biến | Giá trị |
|---|---|
| `DB_HOST` | Host của Aiven |
| `DB_PORT` | Port của Aiven (không phải 3306) |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | Password của Aiven |
| `DB_NAME` | `todopro` |
| `DB_SSL` | `true` |
| `DB_SSL_CA` | **Dán toàn bộ nội dung `ca.pem`**, từ `-----BEGIN CERTIFICATE-----` tới `-----END CERTIFICATE-----` |
| `JWT_SECRET` | Bấm **Generate** trên Render để tạo chuỗi ngẫu nhiên |
| `CLIENT_URL` | `https://<ten-app>.onrender.com` (điền sau khi Render cấp tên, rồi deploy lại) |
| `TRUST_PROXY` | `true` |
| `PAYMENT_MOCK_ENABLED` | `true` (để người xem thử thanh toán giả lập) |

6. Bấm **Deploy**. Build lần đầu mất ~3–5 phút. Trong **Logs**, khi mọi thứ ổn sẽ thấy:
   ```
   ✅ Đã chạy schema.sql
   ✅ Đã tạo tài khoản demo: demo@todopro.vn / Demo@12345
   ✅ Database connected (todopro@...)
   🚀 Server chạy tại ... (production)
   ```
7. Mở `https://<ten-app>.onrender.com`, đăng nhập bằng tài khoản demo

Mỗi lần push lên `main`, Render tự deploy lại. CI trên GitHub vẫn chạy song song để kiểm tra.

## Lỗi thường gặp

| Log báo | Nguyên nhân · cách sửa |
|---|---|
| `Connections using insecure transport are prohibited` | Chưa đặt `DB_SSL=true` |
| `self-signed certificate in certificate chain` | Thiếu `DB_SSL_CA`, hoặc dán nhầm CA |
| `DB_SSL_CA không phải chứng chỉ PEM` | Dán thiếu dòng `-----BEGIN CERTIFICATE-----` |
| `Access denied for user` | Sai `DB_USER` / `DB_PASSWORD` |
| `ETIMEDOUT` / `ECONNREFUSED` | Sai `DB_HOST` / `DB_PORT`, hoặc service Aiven đang tắt (bật lại trên Aiven) |
| `Thiếu biến môi trường` | Thiếu một biến bắt buộc trong bảng trên |
| Đăng nhập xong vẫn bị coi là chưa đăng nhập | Kiểm tra `TRUST_PROXY=true`. Cookie đăng nhập cần HTTPS, Render cung cấp sẵn |
| Thao tác bị 403 `FORBIDDEN_ORIGIN` | `CLIENT_URL` khác tên miền thật của app |

## VNPay sandbox (tùy chọn)

Có tài khoản sandbox thì thêm các biến:

| Biến | Giá trị |
|---|---|
| `VNP_TMN_CODE`, `VNP_HASH_SECRET` | từ email VNPay |
| `VNP_RETURN_URL` | `https://<ten-app>.onrender.com/api/payments/vnpay/return` |

Trong trang quản lý merchant sandbox, khai báo **IPN URL**: `https://<ten-app>.onrender.com/api/payments/vnpay/ipn`. Production **không** bật `VNP_CONFIRM_ON_RETURN`. Không cấu hình VNPay thì phương thức này tự ẩn, trang vẫn chạy với thanh toán giả lập.

Thẻ test NCB (kiểm tra lại trong email VNPay): `9704198526191432198`, tên `NGUYEN VAN A`, ngày phát hành `07/15`, OTP `123456`.

## Nếu tách Frontend và Backend ra 2 tên miền

Ví dụ Frontend trên Netlify và Backend trên Render. Khi đó cần thêm:
- `COOKIE_SAMESITE=none` (cookie tự bật `Secure`, bắt buộc HTTPS) và `CLIENT_URL=https://<frontend>.netlify.app`. Middleware `checkOrigin` sẽ chặn request thay đổi dữ liệu đến từ tên miền không có trong `CLIENT_URL`
- Sửa `frontend/js/config.js` để `API_BASE_URL` trỏ tới Backend

Cookie bên thứ ba ngày càng bị trình duyệt siết chặt, nên **khuyến nghị giữ cách 1 dịch vụ** ở trên.

## Checklist trước khi gửi link cho nhà tuyển dụng

- [ ] Mở trang trên điện thoại thật
- [ ] Đăng ký tài khoản mới → mua gói bằng thanh toán giả lập → dùng Todo App
- [ ] Đăng nhập tài khoản demo
- [ ] Mở trang một lần trước khi gửi link, để bản Free "thức dậy"
- [ ] Thêm link demo vào `README.md` và CV
