# Giai đoạn 4 — Nền tảng Frontend + trang Đăng nhập/Đăng ký

**Mục tiêu:** Dựng "bộ khung" dùng chung cho mọi trang (CSS, navbar, cách gọi API, thông báo), sau đó làm 2 trang login và register nối với API ở giai đoạn 3.

## 4.1 Design system (CSS dùng chung)

- [ ] `css/base.css`: reset CSS + **biến màu** trong `:root`, lấy từ giao diện cũ (hồng `#f24b9c`, nền kính mờ, font Jost) để giữ nhận diện
  ```css
  :root { --color-primary:#f24b9c; --color-text:#fff; --radius:20px; --space-md:16px; ... }
  ```
- [ ] `css/components.css`: `.btn`, `.btn--primary`, `.card`, `.form-field`, `.navbar`, `.toast`, `.badge`
- [ ] Responsive: dùng được ở màn hình 360px (điện thoại) đến 1440px

## 4.2 JavaScript dùng chung

- [ ] `js/api/http.js`: **một hàm duy nhất** để gọi API
  ```js
  // request('/auth/login', { method:'POST', body:{...} })
  // - tự thêm BASE_URL, credentials:'include', header JSON
  // - success:false → throw Error(message)
  // - 401 → chuyển về trang login
  ```
- [ ] `js/api/auth.api.js`: `register()`, `login()`, `logout()`, `getMe()`, chỉ gọi `request`
- [ ] `js/components/navbar.js`: vẽ navbar. Chưa đăng nhập hiện "Đăng nhập / Đăng ký". Đã đăng nhập hiện tên, giỏ hàng (số lượng), "Đơn hàng", "Đăng xuất"
- [ ] `js/components/toast.js`: `showToast(message, type)` để báo thành công/lỗi
- [ ] `js/utils/auth-guard.js`: `requireLogin()` dùng cho trang cần đăng nhập. Chưa đăng nhập thì chuyển sang `login.html?redirect=<trang hiện tại>`
- [ ] Mọi file JS dùng `<script type="module">` với `import/export`

## 4.3 Trang Đăng nhập / Đăng ký

- [ ] `pages/register.html` + `js/pages/register.js`: form họ tên, email, mật khẩu, nhập lại mật khẩu. Kiểm tra dữ liệu ở FE trước khi gửi, hiện lỗi dưới từng ô
- [ ] `pages/login.html` + `js/pages/login.js`: đăng nhập xong thì quay về `redirect` (nếu có) hoặc trang chủ
- [ ] Nút submit có trạng thái đang tải (disable + "Đang xử lý...") để tránh bấm 2 lần

## Kết quả khi xong

- Đăng ký → đăng nhập → navbar hiện tên → đăng xuất, tất cả chạy trên trình duyệt
- Không có đoạn `fetch` nào nằm ngoài `http.js`

## Lưu ý

- Kiểm tra ở FE chỉ để **trải nghiệm tốt hơn**. Kiểm tra thật vẫn nằm ở middleware `validate` phía BE.
