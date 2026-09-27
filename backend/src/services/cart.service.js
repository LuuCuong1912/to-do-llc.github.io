import pool from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import * as cartModel from '../models/cart.model.js';
import * as packageModel from '../models/package.model.js';

export const ALLOWED_MONTHS = [1, 3, 6, 12];

const toCartItem = (row) => ({
  id: row.id,
  months: row.months,
  package: { id: row.package_id, code: row.code, name: row.name, tier: row.tier },
  unitPrice: row.price_per_month, // giá / tháng, LUÔN lấy từ bảng packages
  subtotal: row.price_per_month * row.months,
});

// Tính giỏ hàng từ các dòng DB — dùng chung cho xem giỏ và tạo đơn hàng
export const buildCart = (rows) => {
  const items = rows.map(toCartItem);
  return {
    items,
    itemCount: items.length,
    totalAmount: items.reduce((sum, item) => sum + item.subtotal, 0),
  };
};

export const getCart = async (userId, { db = pool, lock = false } = {}) =>
  buildCart(await cartModel.findByUser(userId, { db, lock }));

export const addItem = async (userId, { packageId, months }) => {
  const pkg = await packageModel.findActiveById(packageId);
  if (!pkg) throw new ApiError(404, 'PACKAGE_NOT_FOUND', 'Không tìm thấy gói');

  await cartModel.upsert({ userId, packageId, months });
  return getCart(userId);
};

const toId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy mục trong giỏ');
  return id;
};

export const updateItem = async (userId, itemId, { months }) => {
  const affected = await cartModel.updateMonths({ id: toId(itemId), userId, months });
  // 0 dòng = không tồn tại HOẶC của người khác → cùng trả 404, không để lộ thông tin
  if (affected === 0) throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy mục trong giỏ');
  return getCart(userId);
};

export const removeItem = async (userId, itemId) => {
  const affected = await cartModel.remove({ id: toId(itemId), userId });
  if (affected === 0) throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy mục trong giỏ');
  return getCart(userId);
};

export const countItems = (userId) => cartModel.countByUser(userId);
