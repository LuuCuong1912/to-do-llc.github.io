const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

// formatVND(29000) → "29.000 ₫"
export const formatVND = (amount) => vnd.format(amount);

export const formatDate = (value) => new Date(value).toLocaleDateString('vi-VN');

export const formatDateTime = (value) =>
  new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

// Phải giống ALLOWED_MONTHS ở backend/src/services/cart.service.js
export const MONTH_OPTIONS = [1, 3, 6, 12];

export const ORDER_STATUS = {
  pending: { label: 'Chờ thanh toán', tone: 'warning' },
  paid: { label: 'Đã thanh toán', tone: 'success' },
  failed: { label: 'Thất bại', tone: 'danger' },
  cancelled: { label: 'Đã hủy', tone: 'muted' },
};

export const PAYMENT_METHOD_LABEL = { mock: 'Giả lập (demo)', vnpay: 'VNPay' };
