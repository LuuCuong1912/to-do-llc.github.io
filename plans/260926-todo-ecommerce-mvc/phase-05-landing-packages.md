# Giai đoạn 5 — Landing page + API gói

**Mục tiêu:** Trang chủ đẹp, giới thiệu sản phẩm và 3 gói. Dữ liệu gói lấy từ CSDL qua API, **không viết cứng trong HTML**.

## Backend

| Lớp | File |
|---|---|
| Route | `routes/package.routes.js` — `GET /packages`, `GET /packages/:code` |
| Controller | `controllers/package.controller.js` |
| Service | `services/package.service.js` — chỉ trả gói `is_active = 1`, sắp xếp theo `tier` |
| Model | `models/package.model.js` — `findAllActive`, `findByCode`, `findById` |

- [x] Không cần đăng nhập. Mã gói không tồn tại → 404 `PACKAGE_NOT_FOUND`

## Frontend — `index.html` + `js/pages/landing.js` + `css/pages/landing.css`

Các phần của trang (từ trên xuống):

- [x] **Navbar** (dùng lại component)
- [x] **Hero**: tiêu đề lớn, mô tả ngắn, nút "Xem các gói" (cuộn xuống) _(chưa có ảnh minh họa app Todo trong hero)_
- [x] **Tính năng**: 3 đến 4 thẻ (theo dõi tiến độ, lưu đám mây, hiệu ứng hoàn thành...)
- [x] **Bảng giá**: 3 thẻ gói do `package-card.js` tạo từ API. Gói Gold có nhãn "Phổ biến nhất". Có nút chọn số tháng và nút **"Thêm vào giỏ"**
- [x] **FAQ**: 3 đến 5 câu hỏi dạng xổ xuống (`<details>`)
- [x] **Footer**
- [x] `utils/format.js` (thay cho format-currency.js): `formatVND(29000)` → `29.000 ₫` (dùng `Intl.NumberFormat('vi-VN')`)
- [x] Nút "Thêm vào giỏ" tạm thời chỉ kiểm tra đăng nhập (giai đoạn 6 mới gọi API giỏ)
- [x] Trạng thái đang tải (khung xám) và trạng thái lỗi khi API chết

## Kết quả khi xong

- Sửa giá trong bảng `packages`, tải lại trang thì giá trên landing đổi theo
- Trang hiển thị tốt trên điện thoại (thử bằng DevTools → chế độ thiết bị di động)

## Gợi ý

- Có thể dùng skill `frontend-design` hoặc `web-design-guidelines` trong `.claude/skills/` để review giao diện.

## Ghi chú khi thực hiện (2026-09-26)

- API gói trả camelCase (`pricePerMonth`, `maxTasks`). `features` là mảng (mysql2 tự đọc cột JSON)
- Chọn số tháng bằng radio thật (ẩn) dạng nút → dùng được bằng bàn phím và trình đọc màn hình
- Khách bấm "Thêm vào giỏ" → sang đăng nhập với `?redirect=/#pricing`, xong quay lại đúng bảng giá
- Thẻ gói hiện nhãn "Gói hiện tại" nếu đang dùng gói đó
- CSS: `pages/landing.css` (hero, tính năng, FAQ) + `pages/pricing.css` (thẻ gói). Footer và `.page` nằm trong `layout.css`
