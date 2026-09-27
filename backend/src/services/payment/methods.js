import env from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';

// Danh sách phương thức thanh toán — Frontend hiển thị theo `enabled`
export const getPaymentMethods = () => [
  { code: 'mock', name: 'Thanh toán giả lập (demo)', enabled: env.payment.mockEnabled },
  { code: 'vnpay', name: 'VNPay (thẻ ATM / QR / Visa)', enabled: env.payment.vnpay.enabled },
];

export const PAYMENT_METHOD_CODES = ['mock', 'vnpay'];

export const assertMethodEnabled = (code) => {
  const method = getPaymentMethods().find((m) => m.code === code);
  if (!method?.enabled) {
    throw new ApiError(400, 'PAYMENT_METHOD_DISABLED', 'Phương thức thanh toán này hiện không khả dụng');
  }
};
