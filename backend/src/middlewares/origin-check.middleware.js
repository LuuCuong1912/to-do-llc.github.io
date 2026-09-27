import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

// Chống CSRF: request THAY ĐỔI dữ liệu (POST/PUT/PATCH/DELETE) gửi từ trình duyệt phải đến từ trang của mình.
// CORS chỉ chặn trang lạ ĐỌC phản hồi — không chặn request được gửi đi. Khi cookie là SameSite=None,
// trang lạ có thể gửi "request đơn giản" (vd POST không body) kèm cookie của nạn nhân → cần kiểm tra Origin.
//
// Trình duyệt luôn gửi header Origin với các request này. Công cụ như Postman, curl, VNPay (server gọi server)
// không gửi Origin → cho qua; chúng không mang cookie của người dùng nên không phải CSRF.
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const checkOrigin = (req, res, next) => {
  const origin = req.get('origin');
  if (SAFE_METHODS.has(req.method) || !origin) return next();

  const ownOrigin = `${req.protocol}://${req.get('host')}`; // Frontend do chính Express phục vụ (SERVE_FRONTEND)
  if (origin === ownOrigin || env.clientUrls.includes(origin)) return next();

  next(new ApiError(403, 'FORBIDDEN_ORIGIN', 'Yêu cầu không hợp lệ'));
};
