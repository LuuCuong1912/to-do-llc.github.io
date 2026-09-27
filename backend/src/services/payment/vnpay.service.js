import crypto from 'node:crypto';
import env from '../../config/env.js';
import { withTransaction } from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import { randomCode } from '../../utils/order-code.js';
import * as orderModel from '../../models/order.model.js';
import * as paymentModel from '../../models/payment.model.js';
import * as orderService from '../order.service.js';
import { assertMethodEnabled } from './methods.js';

const PROVIDER = 'vnpay';

// ---------- Chữ ký (theo tài liệu VNPay, phiên bản API 2.1.0) ----------

// Sắp xếp tham số A→Z, mã hóa giá trị dạng form (dấu cách → "+"). Chuỗi này vừa để KÝ vừa làm query của URL.
export const buildQuery = (params) =>
  Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key])).replace(/%20/g, '+')}`)
    .join('&');

export const sign = (query, secret) =>
  crypto.createHmac('sha512', secret).update(Buffer.from(query, 'utf-8')).digest('hex');

// Dữ liệu VNPay gửi về (return / IPN) phải có chữ ký đúng — nếu không, có thể là kẻ xấu tự sửa URL
export const verifySignature = (query, secret = env.payment.vnpay.hashSecret) => {
  const { vnp_SecureHash: received, ...rest } = query;
  if (typeof received !== 'string' || !/^[0-9a-f]+$/i.test(received)) return false;

  const vnpParams = Object.fromEntries(
    Object.entries(rest).filter(([key]) => key.startsWith('vnp_') && key !== 'vnp_SecureHashType'),
  );
  const expected = Buffer.from(sign(buildQuery(vnpParams), secret), 'hex');
  const actual = Buffer.from(received.toLowerCase(), 'hex');
  // So sánh thời gian cố định → không đo được thời gian để đoán chữ ký
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

// yyyyMMddHHmmss theo giờ Việt Nam (GMT+7) — định dạng VNPay yêu cầu
export const formatVnDate = (date) => {
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(
    d.getUTCMinutes(),
  )}${pad(d.getUTCSeconds())}`;
};

const normalizeIp = (ip = '') => (ip === '::1' || !ip ? '127.0.0.1' : ip.replace(/^::ffff:/, ''));

// ---------- Nghiệp vụ ----------

// Tạo URL chuyển người dùng sang trang thanh toán VNPay. Mỗi lần bấm = 1 lần thử (1 dòng payments "pending").
export const createPaymentUrl = async (userId, rawOrderId, ipAddr) => {
  assertMethodEnabled(PROVIDER);
  const config = env.payment.vnpay;
  const orderId = orderService.toOrderId(rawOrderId);

  const { order, txnRef } = await withTransaction(async (conn) => {
    const found = await orderModel.findById(orderId, { db: conn, lock: true });
    orderService.assertOwner(found, userId);
    orderService.assertPayable(found);
    if (found.payment_method !== PROVIDER) {
      throw new ApiError(400, 'PAYMENT_METHOD_MISMATCH', 'Đơn hàng này không dùng thanh toán VNPay');
    }

    // Mã giao dịch phải KHÁC NHAU mỗi lần thử → mã đơn + 4 ký tự ngẫu nhiên
    const ref = `${found.order_code}${randomCode(4)}`;
    await paymentModel.create(
      { orderId: found.id, provider: PROVIDER, transactionRef: ref, amount: found.total_amount, status: 'pending' },
      conn,
    );
    return { order: found, txnRef: ref };
  });

  const now = new Date();
  const query = buildQuery({
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: `Thanh toan don hang ${order.order_code}`, // VNPay khuyến nghị không dấu
    vnp_OrderType: 'other',
    vnp_Amount: order.total_amount * 100, // VNPay tính theo đơn vị 1/100 đồng
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: normalizeIp(ipAddr),
    vnp_CreateDate: formatVnDate(now),
    vnp_ExpireDate: formatVnDate(new Date(now.getTime() + 15 * 60 * 1000)),
  });

  return { paymentUrl: `${config.url}?${query}&vnp_SecureHash=${sign(query, config.hashSecret)}` };
};

// IPN: VNPay gọi thẳng vào server báo kết quả — NGUỒN TIN CẬY DUY NHẤT để xác nhận tiền đã về.
// Trả về { RspCode, Message } đúng bảng mã VNPay quy định.
export const handleIpn = async (query) => {
  if (!verifySignature(query)) return { RspCode: '97', Message: 'Invalid signature' };

  try {
    return await withTransaction(async (conn) => {
      const payment = await paymentModel.findByProviderRef(
        { provider: PROVIDER, transactionRef: query.vnp_TxnRef },
        { db: conn, lock: true },
      );
      const order = payment && (await orderModel.findById(payment.order_id, { db: conn, lock: true }));
      if (!order) return { RspCode: '01', Message: 'Order not found' };

      if (Number(query.vnp_Amount) !== order.total_amount * 100) return { RspCode: '04', Message: 'Invalid amount' };

      // Đã xử lý rồi (VNPay gửi lại IPN nhiều lần) → không cộng gói lần 2
      if (payment.status !== 'pending' || order.status !== 'pending') {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      const isSuccess = query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';
      await paymentModel.updateResult(
        { id: payment.id, status: isSuccess ? 'success' : 'failed', rawResponse: query },
        conn,
      );
      if (isSuccess) await orderService.markPaid(conn, order);
      else await orderService.markFailed(conn, order);

      return { RspCode: '00', Message: 'Confirm Success' };
    });
  } catch (err) {
    console.error('[VNPay IPN]', err);
    return { RspCode: '99', Message: 'Unknown error' };
  }
};

// Return URL: trình duyệt người dùng quay về. KHÔNG tin kết quả ở đây (trừ khi bật confirmOnReturn khi dev).
// → trả về đường dẫn trang kết quả của Frontend
export const handleReturn = async (query) => {
  const isValid = verifySignature(query);
  let orderId = '';

  if (isValid) {
    const payment = await paymentModel.findByProviderRef({ provider: PROVIDER, transactionRef: query.vnp_TxnRef });
    orderId = payment?.order_id ?? '';
    if (payment && env.payment.vnpay.confirmOnReturn) await handleIpn(query);
  }

  const params = new URLSearchParams({ orderId: String(orderId), gateway: isValid ? 'ok' : 'invalid' });
  return `${env.clientUrls[0]}/pages/payment-result.html?${params}`;
};
