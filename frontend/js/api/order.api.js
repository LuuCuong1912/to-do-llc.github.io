import { request } from './http.js';

export const createOrder = async ({ paymentMethod }) =>
  (await request('/orders', { method: 'POST', body: { paymentMethod } })).order;

export const getOrders = async () => (await request('/orders')).orders;

export const getOrder = async (orderId) => (await request(`/orders/${encodeURIComponent(orderId)}`)).order;
