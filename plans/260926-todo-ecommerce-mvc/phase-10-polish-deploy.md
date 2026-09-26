# Giai đoạn 10 — Test, tài liệu, deploy, đưa vào CV

**Mục tiêu:** Dự án đủ chuyên nghiệp để nhà tuyển dụng mở ra xem: có link chạy thật, có README đẹp, có test.

## Test

- [ ] Cài `jest` (hoặc `vitest`) + `supertest` trong backend
- [ ] **Unit test cho service** (quan trọng nhất): tính tổng giỏ, giới hạn số việc, chọn gói cao nhất còn hạn, không thanh toán 2 lần
- [ ] **Integration test cho API**: đăng ký → đăng nhập → thêm giỏ → đặt hàng → thanh toán giả lập (dùng một database test riêng)
- [ ] Tự kiểm tra thủ công trên Chrome + điện thoại thật theo checklist của các giai đoạn trước

## Chất lượng code

- [ ] Cài ESLint + Prettier, chạy toàn bộ dự án
- [ ] Rà lại: không còn `console.log` thừa, không có secret trong code, không có file > 200 dòng
- [ ] Chạy skill `/ck:code-review` và `security-scan` trong `.claude/` để review

## Tài liệu (`docs/` + `README.md`)

- [ ] `README.md` ở gốc: giới thiệu, ảnh chụp/GIF, **link demo**, công nghệ, sơ đồ kiến trúc (mục 3 của plan), sơ đồ ERD, cách chạy local, tài khoản demo
- [ ] `docs/api.md`: danh sách API (có thể xuất từ Postman collection)
- [ ] `backend/README.md`: biến môi trường, lệnh chạy, lệnh test

## Deploy (miễn phí hoặc gần miễn phí)

| Phần | Gợi ý |
|---|---|
| Frontend | Netlify, Vercel hoặc GitHub Pages |
| Backend | Render hoặc Railway |
| MySQL | Aiven (gói free), Railway hoặc TiDB Serverless |

- [ ] FE và BE khác tên miền nên cookie phải đặt `sameSite: 'none'` và `secure: true` ở production. Nếu không muốn xử lý chuyện này, có thể cho Express phục vụ luôn thư mục `frontend/` (cùng tên miền)
- [ ] Cập nhật `CLIENT_URL`, `VNP_RETURN_URL`, URL IPN theo tên miền thật
- [ ] Tạo tài khoản demo có sẵn gói Pro để nhà tuyển dụng thử nhanh

## Mô tả dự án trên CV (gợi ý)

> **TodoPro — Website bán gói ứng dụng Todo** · HTML/CSS/JS, Node.js, Express, MySQL, VNPay
> - Thiết kế backend nhiều lớp (Route → Middleware → Controller → Service → Model), 20+ REST API
> - Xác thực JWT bằng cookie httpOnly, mã hóa mật khẩu bcrypt, giới hạn số lần đăng nhập, kiểm tra dữ liệu bằng Joi
> - Giỏ hàng, đơn hàng, thanh toán VNPay (kiểm tra chữ ký HMAC-SHA512, IPN), dùng transaction để chống thanh toán trùng
> - Phân quyền tính năng theo gói đăng ký (Basic/Gold/Pro)
> - Demo: <link> · GitHub: <link>

## Kết quả khi xong

- Link demo chạy được, README có ảnh chụp, test pass
- Merge nhánh `feature/ecommerce` vào `main`, gắn tag `v2.0`
