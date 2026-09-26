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

- [ ] Tạo các file trên theo đúng thứ tự: model → service → controller → validator → route
- [ ] Mật khẩu hash bằng `bcrypt` với saltRounds = 10
- [ ] Thông báo khi đăng nhập sai phải **giống nhau** cho cả "sai email" lẫn "sai mật khẩu" (không để lộ email nào đã đăng ký)
- [ ] `me` trả về user kèm gói đang dùng (tạm để `null`, giai đoạn 7 sẽ bổ sung)
- [ ] Viết file `backend/requests/auth.http` (dùng extension REST Client) để thử nhanh

## Kết quả khi xong

- Đăng ký bằng email trùng → 409
- Đăng nhập đúng → có cookie `token`. Gọi `/me` → trả thông tin user
- Đăng nhập sai quá 5 lần → 429
- Trong bảng `users`, cột mật khẩu là chuỗi hash, **không phải mật khẩu gốc**
