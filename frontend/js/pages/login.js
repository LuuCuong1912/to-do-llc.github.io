import { login } from '../api/auth.api.js';
import { initPage, getRedirectTarget } from '../utils/auth-guard.js';
import { setFlashToast } from '../components/toast.js';
import { validateLogin } from '../utils/validators.js';
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

const form = document.getElementById('login-form');
const submitButton = form.querySelector('[type="submit"]');

bindPasswordToggles(form);
bindErrorClearOnInput(form);

// Giữ nguyên ?redirect=... khi chuyển qua trang Đăng ký
document.getElementById('register-link').search = window.location.search;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFormErrors(form);

  const values = getFormValues(form);
  values.email = values.email.trim();

  const errors = validateLogin(values);
  if (errors.length > 0) return showFieldErrors(form, errors);

  setSubmitting(submitButton, true, 'Đang đăng nhập...');
  try {
    const { user } = await login(values);
    setFlashToast(`Chào mừng trở lại, ${user.fullName}!`);
    window.location.replace(getRedirectTarget());
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') showFieldErrors(form, err.details);
    else showFormAlert(form, err.message); // sai mật khẩu, thử quá nhiều lần, mất kết nối...

    form.elements.password.value = '';
    form.elements.password.focus();
    setSubmitting(submitButton, false);
  }
});
