import { request } from './http.js';

// Mọi hàm trả về giỏ hàng mới nhất: { items, itemCount, totalAmount }
export const getCart = async () => (await request('/cart')).cart;

export const addToCart = async ({ packageId, months }) =>
  (await request('/cart/items', { method: 'POST', body: { packageId, months } })).cart;

export const updateCartItem = async (itemId, { months }) =>
  (await request(`/cart/items/${itemId}`, { method: 'PATCH', body: { months } })).cart;

export const removeCartItem = async (itemId) => (await request(`/cart/items/${itemId}`, { method: 'DELETE' })).cart;
