import { request } from './http.js';

export const getPaymentMethods = async () => (await request('/payments/methods')).methods;

export const payMock = async (orderId) => (await request(`/payments/mock/${orderId}`, { method: 'POST' })).order;

export const createVnpayUrl = async (orderId) =>
  (await request(`/payments/vnpay/${orderId}`, { method: 'POST' })).paymentUrl;
