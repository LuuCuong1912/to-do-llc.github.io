import { register } from '../api/auth.api.js';
import { initPage, getRedirectTarget } from '../utils/auth-guard.js';
import { setFlashToast } from '../components/toast.js';
import { validateRegister } from '../utils/validators.js';
import {
  getFormValues,
  clearFormErrors,
  showFieldErrors,
  showFormAlert,
  setSubmitting,
  bindPasswordToggles,
  bindErrorClearOnInput,
} from '../utils/form.js';

await initPage({ access: 'guest' });

const form = document.getElementById('register-form');
const submitButton = form.querySelector('[type="submit"]');

bindPasswordToggles(form);
bindErrorClearOnInput(form);

// Giữ nguyên ?redirect=... khi chuyển qua trang Đăng nhập
document.getElementById('login-link').search = window.location.search;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFormErrors(form);

  const values = getFormValues(form);
  values.fullName = values.fullName.trim();
  values.email = values.email.trim();

  const errors = validateRegister(values);
  if (errors.length > 0) return showFieldErrors(form, errors);

  setSubmitting(submitButton, true, 'Đang tạo tài khoản...');
  try {
    // Backend đăng nhập luôn sau khi đăng ký thành công
    const { user } = await register(values);
    setFlashToast(`Tạo tài khoản thành công. Chào mừng ${user.fullName}!`);
    window.location.replace(getRedirectTarget());
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') showFieldErrors(form, err.details);
    else if (err.code === 'EMAIL_TAKEN') showFieldErrors(form, [{ field: 'email', message: err.message }]);
    else showFormAlert(form, err.message);

    setSubmitting(submitButton, false);
  }
});
