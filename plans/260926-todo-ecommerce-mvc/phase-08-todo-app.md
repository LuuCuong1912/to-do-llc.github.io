# Giai đoạn 8 — Todo App theo gói

**Mục tiêu:** Đưa app Todo cũ vào hệ thống: chỉ người đã mua gói mới dùng được, dữ liệu lưu CSDL, số việc tối đa theo gói.

## Backend

| Lớp | File | Ghi chú |
|---|---|---|
| Route | `routes/todo.routes.js` | `authenticate` → `requireSubscription` |
| Middleware | `middlewares/subscription.middleware.js` | Gọi `subscriptionService.getCurrentPlan`. Không có gói còn hạn → 403 `SUBSCRIPTION_REQUIRED`. Có thì gắn `req.plan` |
| Validator | `validators/todo.validator.js` | `text` 1–200 ký tự; `completed` boolean |
| Controller / Service / Model | `todo.*.js` | CRUD: list, create, update (sửa text / đánh dấu xong), delete |

- [x] `todoService.create`: đếm số todo hiện có. Nếu ≥ `req.plan.max_tasks` (và khác NULL) → 403 `TASK_LIMIT_REACHED` kèm gợi ý nâng cấp gói
- [x] Mọi thao tác update/delete đều lọc theo `user_id` (không sửa được todo của người khác)
- [x] Giữ quy tắc cũ: việc đã hoàn thành thì không sửa được nội dung (kiểm tra ở service)

## Frontend — `pages/app.html` + `js/pages/todo-app.js` + `css/pages/todo.css`

- [x] Chuyển giao diện từ `frontend/legacy/` sang, dùng biến màu trong `base.css`
- [x] Thay `localStorage` bằng `js/api/todo.api.js`
- [x] Hiện "Đã dùng 12 / 20 việc (gói Basic)". Chạm giới hạn thì hiện nút "Nâng cấp gói" → landing `#pricing`
- [x] Nhận 403 `SUBSCRIPTION_REQUIRED` → hiện màn hình "Bạn chưa có gói" + nút mua
- [x] Tính năng theo gói (tùy chọn): pháo giấy chỉ có ở Gold trở lên
- [x] **Sửa các lỗi của code cũ khi chuyển:**
  - `li.innerHTML = \`...<span>${taskText}</span>\`` dính lỗi **XSS**: tạo phần tử bằng `createElement` và gán `textContent`
  - `lang="vn"` sửa thành `lang="vi"`
  - Sửa tên hàm/biến gõ sai: `updateProgess` → `updateProgress`, `progrssNumbers` → `progressNumbers`
  - Confetti đang dùng tọa độ cứng (x: 1500) nên sai trên màn hình nhỏ: tính theo `window.innerWidth`
- [x] Xóa thư mục `frontend/legacy/` sau khi chuyển xong

## Kết quả khi xong

- Tài khoản chưa mua: vào `app.html` → thấy màn hình mời mua gói
- Tài khoản Basic: thêm việc thứ 21 → bị chặn, có thông báo nâng cấp
- Nhập `<img src=x onerror=alert(1)>` làm tên việc → hiện đúng chữ đó, **không chạy script**

## Ghi chú khi thực hiện (2026-09-26)

- Tính năng theo gói: Basic chỉ thêm/đánh dấu/xóa; **sửa nội dung từ Gold** (`FEATURE_MIN_TIER.editTodo = 2`), kiểm tra ở Backend; pháo giấy từ Gold (Frontend)
- Chống vượt giới hạn khi gửi nhiều request cùng lúc: `SELECT ... FOR UPDATE` dòng user trước khi đếm (đã thử 5 request đồng thời khi còn 2 chỗ → đúng 2 được thêm)
- Frontend tách `components/todo-item.js` (1 dòng, sửa tại chỗ Enter/Esc) + `utils/confetti.js` (chỉ tải thư viện khi cần, tính tọa độ theo kích thước cửa sổ)
- Đã sửa lỗi code cũ: XSS `innerHTML`, `lang="vn"`, tên gõ sai, confetti tọa độ cứng. **Đã xóa `frontend/legacy/`** (vẫn còn trong lịch sử git)
- Thêm rule `[hidden] { display: none !important }` vì `img { display: block }` ghi đè thuộc tính `hidden`

## Bổ sung: bản dùng thử (2026-09-26, theo yêu cầu người dùng)

- Nút **"Dùng thử miễn phí"** ở hero trang chủ + mục "Dùng thử" trên navbar khách → `/pages/app.html`
- `app.html` giờ ai cũng mở được (`initPage({ access: 'public' })`):
  - Có gói còn hạn → bản đầy đủ, dữ liệu MySQL (`api/todo.api.js`)
  - Chưa đăng nhập / chưa có gói → **bản dùng thử** (`api/trial-todo.store.js`): lưu localStorage, tối đa 5 việc, quy tắc như Basic (không sửa nội dung, không pháo giấy)
  - 2 nguồn dữ liệu có cùng các hàm `getTodos / createTodo / updateTodo / deleteTodo` → giao diện dùng chung, chỉ đổi `store`
- Màn hình "Bạn chưa có gói nào" được thay bằng bản dùng thử + dải thông báo mời Đăng ký (khách) / Mua gói (đã đăng nhập)
- Đã có gói thì nút đổi thành "Mở Todo App"
- Đã kiểm tra trên Chrome (20/20): thêm đủ 5 việc thì khóa, tải lại vẫn còn, localStorage bị sửa hỏng vẫn chạy, XSS hiện dạng chữ, tài khoản Pro vẫn dùng dữ liệu server
- Chưa làm: chuyển việc của bản dùng thử lên tài khoản sau khi mua gói
