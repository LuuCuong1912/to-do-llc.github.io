# Giai đoạn 10 — Test, tài liệu, deploy, đưa vào CV

**Mục tiêu:** Dự án đủ chuyên nghiệp để nhà tuyển dụng mở ra xem: có link chạy thật, có README đẹp, có test.

## Test

- [x] Cài `jest` (hoặc `vitest`) + `supertest` trong backend
- [x] **Unit test cho service** (quan trọng nhất): tính tổng giỏ, giới hạn số việc, chọn gói cao nhất còn hạn, không thanh toán 2 lần
- [ ] **Integration test cho API** _(chưa làm: cần database test riêng — thay bằng test API qua supertest không cần DB + kịch bản e2e chạy tay)_: đăng ký → đăng nhập → thêm giỏ → đặt hàng → thanh toán giả lập (dùng một database test riêng)
- [ ] Tự kiểm tra thủ công trên Chrome + điện thoại thật _(đã kiểm tra bằng Chrome tự động ở 375px; **chưa thử trên điện thoại thật**)_ theo checklist của các giai đoạn trước

## Chất lượng code

- [x] Cài ESLint + Prettier, chạy toàn bộ dự án
- [x] Rà lại: không còn `console.log` thừa, không có secret trong code, không có file > 200 dòng _(còn `css/pages/todo.css` 221 dòng, `css/layout.css` 214 dòng — chỉ vượt nhẹ, giữ nguyên)_
- [ ] Chạy skill `/ck:code-review` và `security-scan` trong `.claude/` để review

## Tài liệu (`docs/` + `README.md`)

- [x] `README.md` ở gốc: giới thiệu, ảnh chụp/GIF, **link demo**, công nghệ, sơ đồ kiến trúc (mục 3 của plan), sơ đồ ERD, cách chạy local, tài khoản demo
- [x] `docs/api.md`: danh sách API (có thể xuất từ Postman collection)
- [ ] `backend/README.md` _(không tạo riêng — gộp vào README gốc)_: biến môi trường, lệnh chạy, lệnh test

## Deploy (miễn phí hoặc gần miễn phí)

| Phần | Gợi ý |
|---|---|
| Frontend | Netlify, Vercel hoặc GitHub Pages |
| Backend | Render hoặc Railway |
| MySQL | Aiven (gói free), Railway hoặc TiDB Serverless |

- [x] FE và BE khác tên miền nên cookie phải đặt `sameSite: 'none'` và `secure: true` ở production. Nếu không muốn xử lý chuyện này, có thể cho Express phục vụ luôn thư mục `frontend/` (cùng tên miền)
- [ ] Cập nhật `CLIENT_URL`, `VNP_RETURN_URL`, URL IPN theo tên miền thật _(chờ deploy — hướng dẫn trong docs/deploy.md)_
- [x] Tạo tài khoản demo có sẵn gói Pro để nhà tuyển dụng thử nhanh

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

## Ghi chú khi thực hiện (2026-09-26)

- **Test:** Vitest + Supertest, 37 test, không cần MySQL (model được giả lập bằng `vi.mock`, biến môi trường giả trong `vitest.config.js`). Không làm integration test với DB thật vì user MySQL `todopro` chỉ có quyền trên database `todopro` (muốn có thì cần `GRANT ... ON todopro_test.*`)
- **ESLint + Prettier** đặt ở thư mục gốc (`package.json` gốc), dùng chung cho frontend + backend. Đã format toàn bộ code
- **Tài khoản demo:** `npm run db:seed-demo` → `demo@todopro.vn / Demo@12345`, gói Pro 12 tháng + 5 việc mẫu
- **Deploy 1 dịch vụ:** `SERVE_FRONTEND=true` (Express phục vụ `frontend/`), `TRUST_PROXY`, `COOKIE_SAMESITE`; `frontend/js/config.js` tự dùng `origin/api` khi không chạy Live Server; helmet CSP cho phép Google Fonts, cdnjs, jsdelivr. Đã thử chế độ này trên trình duyệt: không có request bị chặn
- **Tài liệu:** `README.md` (ảnh chụp, kiến trúc, điểm kỹ thuật), `docs/api.md`, `docs/deploy.md` (Render + MySQL cloud), `docs/postman/` (24 request, đã chạy bằng Newman: 34/34 kiểm tra đạt), `docs/screenshots/` (8 ảnh)
- ⏳ **Còn lại (cần người dùng):** tạo tài khoản Render + MySQL cloud và deploy, cập nhật link demo trong README, merge vào `main`
