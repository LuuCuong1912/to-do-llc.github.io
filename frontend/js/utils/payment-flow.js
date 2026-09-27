import { payMock, createVnpayUrl } from '../api/payment.api.js';

export const resultPageUrl = (orderId) => `/pages/payment-result.html?orderId=${encodeURIComponent(orderId)}`;

// Thanh toán 1 đơn đang "pending" — dùng ở trang Thanh toán, Kết quả và Đơn hàng
//   mock  → gọi API giả lập rồi sang trang kết quả
//   vnpay → chuyển sang trang VNPay; VNPay tự đưa người dùng quay về trang kết quả
export const startPayment = async (order) => {
  if (order.paymentMethod === 'vnpay') {
    window.location.href = await createVnpayUrl(order.id);
    return;
  }
  await payMock(order.id);
  window.location.href = resultPageUrl(order.id);
};
