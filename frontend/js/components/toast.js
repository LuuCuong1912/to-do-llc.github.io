import { el, icon } from '../utils/dom.js';

const ICONS = {
  success: 'circle-check',
  error: 'circle-alert',
  info: 'info',
};

const getContainer = () => {
  let container = document.querySelector('.toast-container');
  if (!container) {
    // aria-live: trình đọc màn hình tự đọc thông báo mới
    container = el('div', { class: 'toast-container', 'aria-live': 'polite' });
    document.body.append(container);
  }
  return container;
};

// showToast('Đăng nhập thành công', 'success')
export const showToast = (message, type = 'info', duration = 3500) => {
  const toast = el(
    'div',
    { class: `toast toast--${type}`, role: type === 'error' ? 'alert' : 'status' },
    icon(ICONS[type] ?? ICONS.info),
    el('span', {}, message),
  );

  getContainer().append(toast);

  setTimeout(() => {
    toast.classList.add('is-leaving');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 400); // dự phòng khi tắt hiệu ứng chuyển động
  }, duration);
};

// Hiện toast ở trang KẾ TIẾP (sau khi chuyển trang), ví dụ "Đăng nhập thành công" hiện ở trang chủ
const FLASH_KEY = 'flash-toast';

export const setFlashToast = (message, type = 'success') => {
  try {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, type }));
  } catch {
    // Trình duyệt chặn sessionStorage → bỏ qua, không ảnh hưởng chức năng chính
  }
};

export const showFlashToast = () => {
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) return;
    sessionStorage.removeItem(FLASH_KEY);
    const { message, type } = JSON.parse(raw);
    showToast(message, type);
  } catch {
    // bỏ qua
  }
};
