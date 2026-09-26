import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

// Chống dò mật khẩu: tối đa 5 lần đăng nhập SAI / 15 phút / IP.
// Đăng nhập đúng không bị tính (skipSuccessfulRequests).
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'TOO_MANY_ATTEMPTS', 'Bạn đã thử quá nhiều lần, vui lòng thử lại sau 15 phút'));
  },
});
