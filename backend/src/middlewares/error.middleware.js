import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

// Không route nào khớp → 404
export const notFound = (req, res, next) => {
  next(new ApiError(404, 'NOT_FOUND', `Không tìm thấy ${req.method} ${req.originalUrl}`));
};

// Bắt MỌI lỗi của ứng dụng. Express nhận ra error handler nhờ đủ 4 tham số,
// và middleware này phải được khai báo CUỐI CÙNG trong app.js.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Body gửi lên không phải JSON hợp lệ (lỗi từ express.json())
  if (err.type === 'entity.parse.failed') {
    err = new ApiError(400, 'INVALID_JSON', 'Dữ liệu gửi lên không phải JSON hợp lệ');
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details && { details: err.details }) },
    });
  }

  // Lỗi không lường trước (bug, mất kết nối DB...) → ghi log, không lộ chi tiết cho client
  console.error(err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isProduction ? 'Đã có lỗi xảy ra, vui lòng thử lại sau' : err.message,
    },
  });
};
