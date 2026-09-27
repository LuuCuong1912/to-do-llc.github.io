import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';
import { AUTH_COOKIE } from '../utils/auth-cookie.js';

// Chặn request chưa đăng nhập. Đăng nhập hợp lệ → gắn req.user = { id } cho các lớp sau dùng.
export const authenticate = (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: Number(payload.sub) };
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'));
  }
};
