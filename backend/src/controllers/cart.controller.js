import * as cartService from '../services/cart.service.js';

export const getCart = async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  res.json({ success: true, data: { cart } });
};

export const addItem = async (req, res) => {
  const cart = await cartService.addItem(req.user.id, req.body);
  res.status(201).json({ success: true, data: { cart } });
};

export const updateItem = async (req, res) => {
  const cart = await cartService.updateItem(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: { cart } });
};

export const removeItem = async (req, res) => {
  const cart = await cartService.removeItem(req.user.id, req.params.id);
  res.json({ success: true, data: { cart } });
};
