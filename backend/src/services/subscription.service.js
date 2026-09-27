import * as subscriptionModel from '../models/subscription.model.js';

// Đơn hàng thanh toán xong → mỗi gói trong đơn tạo 1 khoảng thời hạn sử dụng.
// Chạy bên trong transaction của việc thanh toán (conn).
export const activateFromOrder = async (conn, order, orderItems) => {
  for (const item of orderItems) {
    await subscriptionModel.create(
      { userId: order.user_id, packageId: item.package_id, orderId: order.id, months: item.months },
      conn,
    );
  }
};

// → { code, name, tier, maxTasks, endAt } hoặc null nếu chưa có gói còn hạn
export const getCurrentPlan = async (userId) => {
  const row = await subscriptionModel.findCurrentPlan(userId);
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    tier: row.tier,
    maxTasks: row.max_tasks, // null = không giới hạn
    endAt: row.end_at,
  };
};
