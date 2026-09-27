import { withTransaction } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import { generateOrderCode } from '../utils/order-code.js';
import * as orderModel from '../models/order.model.js';
import * as orderItemModel from '../models/order-item.model.js';
import * as cartModel from '../models/cart.model.js';
import * as cartService from './cart.service.js';
import * as subscriptionService from './subscription.service.js';
import { assertMethodEnabled } from './payment/methods.js';

const toPublicOrder = (order, items) => ({
  id: order.id,
  orderCode: order.order_code,
  status: order.status, // pending | paid | failed | cancelled
  paymentMethod: order.payment_method,
  totalAmount: order.total_amount,
  createdAt: order.created_at,
  paidAt: order.paid_at,
  items: items.map((item) => ({
    id: item.id,
    packageId: item.package_id,
    packageName: item.package_name, // tên + giá LÚC MUA, không đổi khi gói đổi giá
    unitPrice: item.unit_price,
    months: item.months,
    subtotal: item.subtotal,
  })),
});

export const toOrderId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng');
  return id;
};

// Đơn không tồn tại HOẶC của người khác → cùng 404, không để lộ đơn của người khác có tồn tại
export const assertOwner = (order, userId) => {
  if (!order || order.user_id !== userId) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng');
};

export const assertPayable = (order) => {
  if (order.status === 'paid') throw new ApiError(409, 'ORDER_ALREADY_PAID', 'Đơn hàng đã được thanh toán');
  if (order.status !== 'pending') {
    throw new ApiError(409, 'ORDER_NOT_PAYABLE', 'Đơn hàng không thể thanh toán, vui lòng đặt đơn mới');
  }
};

export const getOrderDetail = async (userId, orderId) => {
  const order = await orderModel.findById(toOrderId(orderId));
  assertOwner(order, userId);
  const items = await orderItemModel.findByOrderIds([order.id]);
  return toPublicOrder(order, items);
};

export const listOrders = async (userId) => {
  const orders = await orderModel.listByUser(userId);
  const items = await orderItemModel.findByOrderIds(orders.map((o) => o.id));
  return orders.map((order) =>
    toPublicOrder(
      order,
      items.filter((item) => item.order_id === order.id),
    ),
  );
};

// Tạo đơn (pending) từ giỏ hàng. Giỏ hàng CHƯA bị xóa — chỉ xóa khi thanh toán thành công.
export const createFromCart = async (userId, { paymentMethod }) => {
  assertMethodEnabled(paymentMethod);

  const orderId = await withTransaction(async (conn) => {
    // Khóa các dòng giỏ hàng: người dùng không sửa giỏ được trong lúc đang tạo đơn
    const cart = await cartService.getCart(userId, { db: conn, lock: true });
    if (cart.items.length === 0) throw new ApiError(400, 'CART_EMPTY', 'Giỏ hàng đang trống');

    const id = await orderModel.create(
      { orderCode: generateOrderCode(), userId, totalAmount: cart.totalAmount, paymentMethod },
      conn,
    );
    await orderItemModel.createMany(
      id,
      cart.items.map((item) => ({
        packageId: item.package.id,
        packageName: item.package.name,
        unitPrice: item.unitPrice,
        months: item.months,
        subtotal: item.subtotal,
      })),
      conn,
    );
    return id;
  });

  return getOrderDetail(userId, orderId);
};

// Dùng chung cho MỌI cổng thanh toán (mock, VNPay) khi tiền đã về. Phải gọi trong transaction đã khóa đơn.
export const markPaid = async (conn, order) => {
  await orderModel.markPaid(order.id, conn);
  const items = await orderItemModel.findByOrderIds([order.id], conn);
  await subscriptionService.activateFromOrder(conn, order, items);
  await cartModel.removePackages({ userId: order.user_id, packageIds: items.map((i) => i.package_id) }, conn);
};

export const markFailed = async (conn, order) => {
  await orderModel.markFailed(order.id, conn);
};
