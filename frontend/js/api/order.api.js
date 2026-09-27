import { request } from './http.js';

export const createOrder = async ({ paymentMethod }) =>
  (await request('/orders', { method: 'POST', body: { paymentMethod } })).order;

export const getOrders = async () => (await request('/orders')).orders;

export const cancelOrder = async (orderId) => (await request(`/orders/${orderId}/cancel`, { method: 'PATCH' })).order;

export const getOrder = async (orderId) => (await request(`/orders/${encodeURIComponent(orderId)}`)).order;
