import { withTransaction } from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import * as orderModel from '../../models/order.model.js';
import * as paymentModel from '../../models/payment.model.js';
import * as orderService from '../order.service.js';
import { assertMethodEnabled } from './methods.js';

// Thanh toán giả lập: bấm là thành công. Đi qua ĐÚNG luồng như cổng thật (khóa đơn → ghi payment → markPaid).
export const pay = async (userId, rawOrderId) => {
  assertMethodEnabled('mock');
  const orderId = orderService.toOrderId(rawOrderId);

  await withTransaction(async (conn) => {
    const order = await orderModel.findById(orderId, { db: conn, lock: true });
    orderService.assertOwner(order, userId);
    orderService.assertPayable(order);
    if (order.payment_method !== 'mock') {
      throw new ApiError(400, 'PAYMENT_METHOD_MISMATCH', 'Đơn hàng này không dùng thanh toán giả lập');
    }

    await paymentModel.create(
      { orderId: order.id, provider: 'mock', amount: order.total_amount, status: 'success' },
      conn,
    );
    await orderService.markPaid(conn, order);
  });

  return orderService.getOrderDetail(userId, orderId);
};
