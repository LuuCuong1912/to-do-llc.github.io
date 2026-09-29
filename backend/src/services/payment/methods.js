import env from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';

// Thẻ test CÔNG KHAI của VNPay sandbox (có trong tài liệu VNPay) — chỉ dùng được trên sandbox, không trừ tiền thật.
// Gửi cho Frontend để người xem demo thử thanh toán. Chuyển sang VNPay thật (VNP_URL khác sandbox) → tự ẩn.
const VNPAY_SANDBOX_TEST_CARD = {
  bank: 'NCB',
  number: '9704198526191432198',
  holder: 'NGUYEN VAN A',
  issueDate: '07/15',
  otp: '123456',
};

const isVnpaySandbox = () => env.payment.vnpay.url.includes('sandbox.vnpayment.vn');

// Danh sách phương thức thanh toán — Frontend hiển thị theo `enabled`
export const getPaymentMethods = () => [
  { code: 'mock', name: 'Thanh toán giả lập (demo)', enabled: env.payment.mockEnabled },
  {
    code: 'vnpay',
    name: 'VNPay (thẻ ATM / QR / Visa)',
    enabled: env.payment.vnpay.enabled,
    sandbox: isVnpaySandbox(),
    ...(env.payment.vnpay.enabled && isVnpaySandbox() && { testCard: VNPAY_SANDBOX_TEST_CARD }),
  },
];

export const PAYMENT_METHOD_CODES = ['mock', 'vnpay'];

export const assertMethodEnabled = (code) => {
  const method = getPaymentMethods().find((m) => m.code === code);
  if (!method?.enabled) {
    throw new ApiError(400, 'PAYMENT_METHOD_DISABLED', 'Phương thức thanh toán này hiện không khả dụng');
  }
};
