import ApiError from '../utils/ApiError.js';

// Dùng trong route: router.post('/login', validate(loginSchema), controller.login)
// Dữ liệu hợp lệ → thay req.body bằng bản đã làm sạch (trim, lowercase, bỏ field lạ).
export const validate = (schema) => (req, res, next) => {
  const { value, error } = schema.validate(req.body ?? {}, {
    abortEarly: false, // gom TẤT CẢ lỗi, để Frontend hiện lỗi dưới từng ô cùng lúc
    stripUnknown: true, // bỏ field không khai báo trong schema
  });

  if (error) {
    const details = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    return next(new ApiError(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', details));
  }

  req.body = value;
  next();
};
