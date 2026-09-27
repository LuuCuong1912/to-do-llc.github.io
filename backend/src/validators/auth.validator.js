import Joi from 'joi';

const email = Joi.string()
  .trim()
  .lowercase()
  .email({ tlds: { allow: false } })
  .max(255)
  .required()
  .messages({
    'any.required': 'Vui lòng nhập email',
    'string.empty': 'Vui lòng nhập email',
    'string.email': 'Email không hợp lệ',
    'string.max': 'Email tối đa 255 ký tự',
  });

export const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Vui lòng nhập họ tên',
    'string.empty': 'Vui lòng nhập họ tên',
    'string.min': 'Họ tên tối thiểu 2 ký tự',
    'string.max': 'Họ tên tối đa 100 ký tự',
  }),
  email,
  // bcrypt chỉ dùng 72 byte đầu → giới hạn 72 ký tự
  password: Joi.string()
    .min(8)
    .max(72)
    .pattern(/[A-Za-z]/, 'letter')
    .pattern(/\d/, 'number')
    .required()
    .messages({
      'any.required': 'Vui lòng nhập mật khẩu',
      'string.empty': 'Vui lòng nhập mật khẩu',
      'string.min': 'Mật khẩu tối thiểu 8 ký tự',
      'string.max': 'Mật khẩu tối đa 72 ký tự',
      'string.pattern.name': 'Mật khẩu phải có cả chữ và số',
    }),
});

// Đăng nhập không kiểm tra độ mạnh mật khẩu — chỉ cần có
export const loginSchema = Joi.object({
  email,
  password: Joi.string().max(72).required().messages({
    'any.required': 'Vui lòng nhập mật khẩu',
    'string.empty': 'Vui lòng nhập mật khẩu',
    'string.max': 'Mật khẩu tối đa 72 ký tự',
  }),
});
