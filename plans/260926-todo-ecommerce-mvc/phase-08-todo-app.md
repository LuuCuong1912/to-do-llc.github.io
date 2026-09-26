# Giai đoạn 8 — Todo App theo gói

**Mục tiêu:** Đưa app Todo cũ vào hệ thống: chỉ người đã mua gói mới dùng được, dữ liệu lưu CSDL, số việc tối đa theo gói.

## Backend

| Lớp | File | Ghi chú |
|---|---|---|
| Route | `routes/todo.routes.js` | `authenticate` → `requireSubscription` |
| Middleware | `middlewares/subscription.middleware.js` | Gọi `subscriptionService.getCurrentPlan`. Không có gói còn hạn → 403 `SUBSCRIPTION_REQUIRED`. Có thì gắn `req.plan` |
| Validator | `validators/todo.validator.js` | `text` 1–200 ký tự; `completed` boolean |
| Controller / Service / Model | `todo.*.js` | CRUD: list, create, update (sửa text / đánh dấu xong), delete |

- [ ] `todoService.create`: đếm số todo hiện có. Nếu ≥ `req.plan.max_tasks` (và khác NULL) → 403 `TASK_LIMIT_REACHED` kèm gợi ý nâng cấp gói
- [ ] Mọi thao tác update/delete đều lọc theo `user_id` (không sửa được todo của người khác)
- [ ] Giữ quy tắc cũ: việc đã hoàn thành thì không sửa được nội dung (kiểm tra ở service)

## Frontend — `pages/app.html` + `js/pages/todo-app.js` + `css/pages/todo.css`

- [ ] Chuyển giao diện từ `frontend/legacy/` sang, dùng biến màu trong `base.css`
- [ ] Thay `localStorage` bằng `js/api/todo.api.js`
- [ ] Hiện "Đã dùng 12 / 20 việc (gói Basic)". Chạm giới hạn thì hiện nút "Nâng cấp gói" → landing `#pricing`
- [ ] Nhận 403 `SUBSCRIPTION_REQUIRED` → hiện màn hình "Bạn chưa có gói" + nút mua
- [ ] Tính năng theo gói (tùy chọn): pháo giấy chỉ có ở Gold trở lên
- [ ] **Sửa các lỗi của code cũ khi chuyển:**
  - `li.innerHTML = \`...<span>${taskText}</span>\`` dính lỗi **XSS**: tạo phần tử bằng `createElement` và gán `textContent`
  - `lang="vn"` sửa thành `lang="vi"`
  - Sửa tên hàm/biến gõ sai: `updateProgess` → `updateProgress`, `progrssNumbers` → `progressNumbers`
  - Confetti đang dùng tọa độ cứng (x: 1500) nên sai trên màn hình nhỏ: tính theo `window.innerWidth`
- [ ] Xóa thư mục `frontend/legacy/` sau khi chuyển xong

## Kết quả khi xong

- Tài khoản chưa mua: vào `app.html` → thấy màn hình mời mua gói
- Tài khoản Basic: thêm việc thứ 21 → bị chặn, có thông báo nâng cấp
- Nhập `<img src=x onerror=alert(1)>` làm tên việc → hiện đúng chữ đó, **không chạy script**
