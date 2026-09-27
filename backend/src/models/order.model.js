import pool from '../config/db.js';

const COLUMNS = 'id, order_code, user_id, total_amount, status, payment_method, created_at, paid_at';

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

export const listByUser = async (userId, limit = 50) => {
  const [rows] = await pool.execute(
    `SELECT ${COLUMNS} FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ${Number(limit)}`,
    [userId],
  );
  return rows;
};

export const markPaid = async (id, db = pool) => {
  await db.execute("UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ?", [id]);
};

export const markFailed = async (id, db = pool) => {
  await db.execute("UPDATE orders SET status = 'failed' WHERE id = ?", [id]);
};
