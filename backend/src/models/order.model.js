import pool from '../config/db.js';
import { PENDING_ORDER_TTL_MINUTES as TTL } from '../config/order.js';

// expires_at / is_expired tính bằng đồng hồ MySQL (NOW) — cùng đồng hồ với created_at, không lệch múi giờ với Node.
// TTL là hằng số trong code (không phải dữ liệu người dùng) nên ghép thẳng vào câu SQL được.
const COLUMNS = `id, order_code, user_id, total_amount, status, payment_method, created_at, paid_at,
  DATE_ADD(created_at, INTERVAL ${TTL} MINUTE) AS expires_at,
  (status = 'pending' AND created_at < NOW() - INTERVAL ${TTL} MINUTE) AS is_expired`;

export const create = async ({ orderCode, userId, totalAmount, paymentMethod }, db = pool) => {
  const [result] = await db.execute(
    'INSERT INTO orders (order_code, user_id, total_amount, payment_method) VALUES (?, ?, ?, ?)',
    [orderCode, userId, totalAmount, paymentMethod],
  );
  return result.insertId;
};

// `lock = true` → SELECT ... FOR UPDATE: request khác muốn sửa đơn này phải CHỜ tới khi transaction xong
// → chống thanh toán 2 lần cùng lúc cho 1 đơn
export const findById = async (id, { db = pool, lock = false } = {}) => {
  const [rows] = await db.execute(`SELECT ${COLUMNS} FROM orders WHERE id = ? ${lock ? 'FOR UPDATE' : ''}`, [id]);
  return rows[0] ?? null;
};

// Đơn "pending" còn hạn, mới nhất, cùng phương thức thanh toán → ứng viên để dùng lại thay vì tạo đơn trùng
export const findReusablePending = async ({ userId, paymentMethod }, db = pool) => {
  const [rows] = await db.execute(
    `SELECT ${COLUMNS} FROM orders
      WHERE user_id = ? AND payment_method = ? AND status = 'pending'
        AND created_at >= NOW() - INTERVAL ${TTL} MINUTE
      ORDER BY id DESC LIMIT 1 FOR UPDATE`,
    [userId, paymentMethod],
  );
  return rows[0] ?? null;
};

export const listByUser = async (userId, limit = 50) => {
  const [rows] = await pool.execute(
    `SELECT ${COLUMNS} FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ${Number(limit)}`,
    [userId],
  );
  return rows;
};

// Chuyển các đơn "pending" quá hạn của user sang "cancelled" (chạy trước khi liệt kê / tạo đơn — không cần cron)
export const cancelExpired = async (userId, db = pool) => {
  await db.execute(
    `UPDATE orders SET status = 'cancelled'
      WHERE user_id = ? AND status = 'pending' AND created_at < NOW() - INTERVAL ${TTL} MINUTE`,
    [userId],
  );
};

export const markPaid = async (id, db = pool) => {
  await db.execute("UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ?", [id]);
};

export const markFailed = async (id, db = pool) => {
  await db.execute("UPDATE orders SET status = 'failed' WHERE id = ?", [id]);
};

export const markCancelled = async (id, db = pool) => {
  await db.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", [id]);
};
