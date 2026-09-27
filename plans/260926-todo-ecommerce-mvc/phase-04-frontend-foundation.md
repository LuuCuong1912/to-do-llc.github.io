# Giai đoạn 4 — Nền tảng Frontend + trang Đăng nhập/Đăng ký

**Mục tiêu:** Dựng "bộ khung" dùng chung cho mọi trang (CSS, navbar, cách gọi API, thông báo), sau đó làm 2 trang login và register nối với API ở giai đoạn 3.

## 4.1 Design system (CSS dùng chung)

- [x] `css/base.css`: reset CSS + **biến màu** trong `:root`, lấy từ giao diện cũ (hồng `#f24b9c`, nền kính mờ, font Jost) để giữ nhận diện
  ```css
  :root { --color-primary:#f24b9c; --color-text:#fff; --radius:20px; --space-md:16px; ... }
  ```
- [x] `css/components.css`: `.btn`, `.btn--primary`, `.card`, `.form-field`, `.navbar`, `.toast`, `.badge`
- [x] Responsive: dùng được ở màn hình 360px (điện thoại) đến 1440px

## 4.2 JavaScript dùng chung

- [x] `js/api/http.js`: **một hàm duy nhất** để gọi API
  ```js
  // request('/auth/login', { method:'POST', body:{...} })
  // - tự thêm BASE_URL, credentials:'include', header JSON
  // - success:false → throw Error(message)
  // - 401 → chuyển về trang login
  ```
- [x] `js/api/auth.api.js`: `register()`, `login()`, `logout()`, `getMe()`, chỉ gọi `request`
- [x] `js/components/navbar.js`: vẽ navbar. Chưa đăng nhập hiện "Đăng nhập / Đăng ký". Đã đăng nhập hiện tên, giỏ hàng (số lượng), "Đơn hàng", "Đăng xuất"
- [x] `js/components/toast.js`: `showToast(message, type)` để báo thành công/lỗi
- [x] `js/utils/auth-guard.js`: `requireLogin()` dùng cho trang cần đăng nhập. Chưa đăng nhập thì chuyển sang `login.html?redirect=<trang hiện tại>`
- [x] Mọi file JS dùng `<script type="module">` với `import/export`

## 4.3 Trang Đăng nhập / Đăng ký

- [x] `pages/register.html` + `js/pages/register.js`: form họ tên, email, mật khẩu, nhập lại mật khẩu. Kiểm tra dữ liệu ở FE trước khi gửi, hiện lỗi dưới từng ô
- [x] `pages/login.html` + `js/pages/login.js`: đăng nhập xong thì quay về `redirect` (nếu có) hoặc trang chủ
- [x] Nút submit có trạng thái đang tải (disable + "Đang xử lý...") để tránh bấm 2 lần

## Kết quả khi xong

- Đăng ký → đăng nhập → navbar hiện tên → đăng xuất, tất cả chạy trên trình duyệt
- Không có đoạn `fetch` nào nằm ngoài `http.js`

## Lưu ý

- Kiểm tra ở FE chỉ để **trải nghiệm tốt hơn**. Kiểm tra thật vẫn nằm ở middleware `validate` phía BE.

## Ghi chú khi thực hiện (2026-09-26)

**Khác so với kế hoạch / bổ sung:**
- `http.js` **không** tự chuyển về trang login khi gặp 401, vì trang công khai gọi `/me` và đăng nhập sai cũng trả 401. Việc bắt buộc đăng nhập do `initPage({ access: 'required' })` trong `auth-guard.js` xử lý
- `auth-guard.js` → `initPage({ access: 'public' | 'required' | 'guest' })`: gọi ở đầu mỗi trang (lấy session, vẽ navbar, hiện flash toast)
- `config.js`: API dùng **cùng hostname** với trang (127.0.0.1 ↔ 127.0.0.1) để cookie SameSite=Lax được gửi kèm. Backend CORS cho phép nhiều origin (`CLIENT_URL` cách nhau bởi dấu phẩy)
- Live Server: `.vscode/settings.json` đặt root = `/frontend`, host `127.0.0.1`, port 5500 (file này không commit)
- CSS tách 3 file: `base.css` (tokens) · `components.css` (card, button, form) · `layout.css` (navbar, toast) — mỗi file < 200 dòng
- Thêm `utils/dom.js` (`el()` tạo phần tử an toàn, chống XSS), `utils/form.js` (lỗi từng ô, loading, hiện/ẩn mật khẩu), `utils/validators.js` (cùng quy tắc với Backend)
- Chống **Open Redirect**: `?redirect=` chỉ nhận đường dẫn nội bộ bắt đầu bằng `/` (chặn `//evil.com`)
- Flash toast qua `sessionStorage`: thông báo "Đăng nhập thành công" hiện ở trang kế tiếp
- `index.html` mới có phần Hero; bảng giá làm ở giai đoạn 5
- Navbar chưa có "Giỏ hàng (số lượng)" và "Đơn hàng": thêm ở giai đoạn 6 và 7 khi có trang tương ứng

**Đã kiểm tra bằng Chrome (puppeteer, 23 kiểm tra đạt):** đăng ký bỏ trống 4 lỗi · mật khẩu nhập lại không khớp · đăng ký → về trang chủ + toast + navbar có tên · tên chứa `<img onerror>` hiện dạng chữ, không chạy · cookie HttpOnly, JS không đọc được · đã đăng nhập mở /login → chuyển đi · đăng xuất · sai mật khẩu · redirect hợp lệ / chặn `//evil` · mobile 375px: menu ☰, không tràn ngang · Backend tắt → báo "Không kết nối được máy chủ", nút mở lại. Console chỉ có 401 của `/auth/me` khi chưa đăng nhập (đúng thiết kế)
