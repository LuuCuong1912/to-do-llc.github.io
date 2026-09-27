// Thời hạn của đơn hàng và link thanh toán.
// Đơn "pending" chỉ được tự hủy SAU KHI link VNPay đã hết hạn — nếu hủy sớm hơn, khách có thể vẫn trả tiền
// trên trang VNPay cho 1 đơn đã hủy → IPN bị từ chối (RspCode 02) mà gói không được kích hoạt.
export const VNPAY_LINK_TTL_MINUTES = 15;
export const PENDING_ORDER_TTL_MINUTES = 30;

if (PENDING_ORDER_TTL_MINUTES <= VNPAY_LINK_TTL_MINUTES) {
  throw new Error('PENDING_ORDER_TTL_MINUTES phải lớn hơn VNPAY_LINK_TTL_MINUTES');
}
