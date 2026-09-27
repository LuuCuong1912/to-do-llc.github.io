# Giai đoạn 3 — Đăng ký / Đăng nhập (Backend)

**Mục tiêu:** API đăng ký, đăng nhập, đăng xuất, lấy thông tin tôi. Đây là chức năng **đầu tiên đi đủ tất cả các lớp**, nên làm kỹ để các chức năng sau làm theo cùng khuôn.

## File cần tạo

| Lớp | File | Nội dung |
|---|---|---|
| Route | `routes/auth.routes.js` | 4 route ở mục 6 của `plan.md` |
| Middleware | `middlewares/auth.middleware.js` | `authenticate`: đọc cookie `token` → verify JWT → gắn `req.user = { id }`. Sai hoặc hết hạn → 401 |
| Middleware | `middlewares/validate.middleware.js` | `validate(schema)`: kiểm tra `req.body` bằng joi. Sai → 400 kèm danh sách lỗi |
| Middleware | `middlewares/rate-limit.middleware.js` | `loginLimiter`: tối đa 5 lần / 15 phút / IP |
| Validator | `validators/auth.validator.js` | `registerSchema` (full_name, email, password ≥ 8 ký tự), `loginSchema` |
| Controller | `controllers/auth.controller.js` | `register`, `login`, `logout`, `me` |
| Service | `services/auth.service.js` | Logic: kiểm tra email trùng, hash/so sánh mật khẩu, tạo token |
| Model | `models/user.model.js` | `findByEmail`, `findById`, `create` |
| Utils | `utils/jwt.js` | `signToken(payload)`, `verifyToken(token)` |

## Luồng đăng nhập (ví dụ)

```
POST /api/auth/login
 → loginLimiter → validate(loginSchema)
 → authController.login(req,res)
     → authService.login(email, password)
          → userModel.findByEmail(email)          (SQL)
          → bcrypt.compare(password, hash)
          → sai: throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng')
          → đúng: return { user, token }
 → res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: <production>, maxAge: 1 ngày })
 → res.json({ success: true, data: { user } })   // KHÔNG trả password_hash
```

## Việc cần làm

- [x] Tạo các file trên theo đúng thứ tự: model → service → controller → validator → route
- [x] Mật khẩu hash bằng `bcrypt` với saltRounds = 10
- [x] Thông báo khi đăng nhập sai phải **giống nhau** cho cả "sai email" lẫn "sai mật khẩu" (không để lộ email nào đã đăng ký)
- [x] `me` trả về user kèm gói đang dùng (tạm để `null`, giai đoạn 7 sẽ bổ sung)
- [x] Viết file `backend/requests/auth.http` (dùng extension REST Client) để thử nhanh

## Kết quả khi xong

- Đăng ký bằng email trùng → 409
- Đăng nhập đúng → có cookie `token`. Gọi `/me` → trả thông tin user
- Đăng nhập sai quá 5 lần → 429
- Trong bảng `users`, cột mật khẩu là chuỗi hash, **không phải mật khẩu gốc**

## Ghi chú khi thực hiện (2026-09-26)

**Khác so với kế hoạch:**
- API dùng **camelCase** (`fullName`), DB dùng snake_case (`full_name`). Service chuyển đổi qua `toPublicUser()`
- **Đăng ký xong thì đăng nhập luôn** (gắn cookie ngay, trả 201)
- `POST /logout` **không cần** `authenticate`: token hết hạn vẫn đăng xuất (xóa cookie) được
- Thêm `utils/auth-cookie.js` (tên cookie, set/clear) để middleware không phải import từ controller (đúng chiều phân lớp)
- Mật khẩu: 8–72 ký tự (bcrypt chỉ dùng 72 byte đầu), phải có cả chữ và số
- Rate limit chỉ đếm lần đăng nhập **sai** (`skipSuccessfulRequests`)

**Bảo mật bổ sung:**
- So sánh với hash giả khi email không tồn tại → thời gian phản hồi như nhau, không dò được email đã đăng ký
- Bắt `ER_DUP_ENTRY` khi 2 request đăng ký cùng email đến cùng lúc
- `jwt.verify` chỉ chấp nhận thuật toán `HS256`
- `validate` bỏ field lạ (`stripUnknown`), ví dụ gửi `"role":"admin"` sẽ bị bỏ qua

**Đã kiểm tra (curl):** đăng ký 201 + cookie HttpOnly · /me 200 · email trùng 409 · dữ liệu sai 400 kèm lỗi từng field · không gửi body 400 · logout → /me 401 · token giả 401 · email không phân biệt hoa/thường · sai 5 lần → 429 · 3 request đăng ký đồng thời → 201/409/409 · tiếng Việt + emoji lưu đúng · mật khẩu lưu dạng bcrypt `$2b$10$...`
