// Kiểm tra dữ liệu ở Frontend — CÙNG quy tắc với backend/src/validators/auth.validator.js.
// Chỉ để báo lỗi ngay cho người dùng; Backend vẫn luôn kiểm tra lại (không tin Frontend).
// Trả về mảng lỗi dạng [{ field, message }] giống Backend.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const checkEmail = (email, errors) => {
  if (!email) errors.push({ field: 'email', message: 'Vui lòng nhập email' });
  else if (!EMAIL_PATTERN.test(email)) errors.push({ field: 'email', message: 'Email không hợp lệ' });
};

export const validateLogin = ({ email, password }) => {
  const errors = [];
  checkEmail(email, errors);
  if (!password) errors.push({ field: 'password', message: 'Vui lòng nhập mật khẩu' });
  return errors;
};

export const validateRegister = ({ fullName, email, password, confirmPassword }) => {
  const errors = [];

  if (!fullName) errors.push({ field: 'fullName', message: 'Vui lòng nhập họ tên' });
  else if (fullName.length < 2) errors.push({ field: 'fullName', message: 'Họ tên tối thiểu 2 ký tự' });

  checkEmail(email, errors);

  if (!password) errors.push({ field: 'password', message: 'Vui lòng nhập mật khẩu' });
  else if (password.length < 8) errors.push({ field: 'password', message: 'Mật khẩu tối thiểu 8 ký tự' });
  else if (password.length > 72) errors.push({ field: 'password', message: 'Mật khẩu tối đa 72 ký tự' });
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.push({ field: 'password', message: 'Mật khẩu phải có cả chữ và số' });
  }

  // Chỉ kiểm tra ở Frontend — không gửi confirmPassword lên Backend
  if (!confirmPassword) errors.push({ field: 'confirmPassword', message: 'Vui lòng nhập lại mật khẩu' });
  else if (confirmPassword !== password) {
    errors.push({ field: 'confirmPassword', message: 'Mật khẩu nhập lại không khớp' });
  }

  return errors;
};
