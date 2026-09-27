import { getPaymentMethods } from '../services/payment/methods.js';
import * as mockPaymentService from '../services/payment/mock.service.js';
import * as vnpayService from '../services/payment/vnpay.service.js';

export const methods = (req, res) => {
  res.json({ success: true, data: { methods: getPaymentMethods() } });
};

export const payMock = async (req, res) => {
  const order = await mockPaymentService.pay(req.user.id, req.params.orderId);
  res.json({ success: true, data: { order } });
};

export const createVnpayUrl = async (req, res) => {
  const { paymentUrl } = await vnpayService.createPaymentUrl(req.user.id, req.params.orderId, req.ip);
  res.json({ success: true, data: { paymentUrl } });
};

// 2 route dưới do VNPay gọi → trả đúng định dạng VNPay yêu cầu, KHÔNG theo { success, data }
export const vnpayReturn = async (req, res) => {
  res.redirect(await vnpayService.handleReturn(req.query));
};

export const vnpayIpn = async (req, res) => {
  res.json(await vnpayService.handleIpn(req.query));
};
