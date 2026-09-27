import * as orderService from '../services/order.service.js';

export const create = async (req, res) => {
  const order = await orderService.createFromCart(req.user.id, req.body);
  res.status(201).json({ success: true, data: { order } });
};

export const list = async (req, res) => {
  const orders = await orderService.listOrders(req.user.id);
  res.json({ success: true, data: { orders } });
};

export const getById = async (req, res) => {
  const order = await orderService.getOrderDetail(req.user.id, req.params.id);
  res.json({ success: true, data: { order } });
};
