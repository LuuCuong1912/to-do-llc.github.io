import pool from '../config/db.js';

// Tạo thời hạn sử dụng. Mọi phép tính thời gian làm trong MySQL (NOW, DATE_ADD) để không lệch múi giờ với Node.
// Nếu user đang còn hạn CÙNG gói → nối tiếp từ ngày hết hạn cũ (gia hạn), ngược lại bắt đầu từ bây giờ.
export const create = async ({ userId, packageId, orderId, months }, db = pool) => {
  await db.execute(
    `INSERT INTO subscriptions (user_id, package_id, order_id, start_at, end_at)
     SELECT ?, ?, ?, s.start_at, DATE_ADD(s.start_at, INTERVAL ? MONTH)
       FROM (SELECT GREATEST(NOW(), COALESCE(MAX(end_at), NOW())) AS start_at
               FROM subscriptions
              WHERE user_id = ? AND package_id = ?) AS s`,
    [userId, packageId, orderId, months, userId, packageId],
  );
};

// Gói đang dùng = gói có tier CAO NHẤT đang trong thời hạn. end_at = ngày hết hạn xa nhất của gói đó (tính cả gia hạn).
export const findCurrentPlan = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.code, p.name, p.tier, p.max_tasks,
            (SELECT MAX(s2.end_at) FROM subscriptions s2
              WHERE s2.user_id = s.user_id AND s2.package_id = s.package_id) AS end_at
       FROM subscriptions s
       JOIN packages p ON p.id = s.package_id
      WHERE s.user_id = ? AND s.start_at <= NOW() AND s.end_at > NOW()
      ORDER BY p.tier DESC
      LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
};
