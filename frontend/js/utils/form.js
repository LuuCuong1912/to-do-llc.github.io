// Tiện ích dùng chung cho mọi form (đăng nhập, đăng ký, và các form sau này)

// Lấy dữ liệu form thành object: { email: '...', password: '...' }
export const getFormValues = (form) => Object.fromEntries(new FormData(form));

export const clearFormErrors = (form) => {
  form.querySelectorAll('[aria-invalid="true"]').forEach((input) => input.removeAttribute('aria-invalid'));
  form.querySelectorAll('.field-error').forEach((node) => (node.textContent = ''));
  const alert = form.querySelector('.form-alert');
  if (alert) alert.textContent = '';
};

// details: [{ field, message }] — CÙNG định dạng với lỗi VALIDATION_ERROR của Backend,
// nên dùng được cho cả lỗi kiểm tra ở Frontend lẫn lỗi Backend trả về.
// Mỗi ô chỉ hiện lỗi đầu tiên. Con trỏ nhảy tới ô lỗi đầu tiên.
export const showFieldErrors = (form, details) => {
  let firstInvalid = null;

  for (const { field, message } of details) {
    const input = form.elements.namedItem(field);
    const errorNode = form.querySelector(`#${field}-error`);
    if (!input || !errorNode || errorNode.textContent) continue;

    input.setAttribute('aria-invalid', 'true');
    errorNode.textContent = message;
    firstInvalid ??= input;
  }

  firstInvalid?.focus();
};

// Người dùng sửa ô nào thì xóa lỗi của ô đó ngay
export const bindErrorClearOnInput = (form) => {
  form.addEventListener('input', (event) => {
    const input = event.target;
    if (!input.name) return;
    input.removeAttribute('aria-invalid');
    const errorNode = form.querySelector(`#${input.name}-error`);
    if (errorNode) errorNode.textContent = '';
  });
};

// Lỗi chung của cả form (sai mật khẩu, mất kết nối...) hiện ở khung .form-alert
export const showFormAlert = (form, message) => {
  const alert = form.querySelector('.form-alert');
  if (alert) alert.textContent = message;
};

// Khóa nút khi đang gửi → tránh bấm 2 lần tạo 2 request
export const setSubmitting = (button, isSubmitting, loadingText = 'Đang xử lý...') => {
  if (isSubmitting) {
    button.dataset.label = button.textContent;
    button.textContent = loadingText;
  } else if (button.dataset.label) {
    button.textContent = button.dataset.label;
  }
  button.disabled = isSubmitting;
  button.classList.toggle('is-loading', isSubmitting);
};

// Nút con mắt hiện/ẩn mật khẩu: <button data-toggle-password> đặt cạnh <input type="password">
export const bindPasswordToggles = (root = document) => {
  root.querySelectorAll('[data-toggle-password]').forEach((button) => {
    const input = button.parentElement.querySelector('input');
    const icon = button.querySelector('i');

    button.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      button.setAttribute('aria-label', isHidden ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      icon?.classList.toggle('fa-eye', !isHidden);
      icon?.classList.toggle('fa-eye-slash', isHidden);
    });
  });
};
