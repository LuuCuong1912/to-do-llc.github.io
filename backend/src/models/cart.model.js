import pool from '../config/db.js';

// Giỏ hàng kèm thông tin gói. Gói đã ngừng bán (is_active = 0) không hiện trong giỏ.
// `lock = true` → khóa các dòng này tới hết transaction (dùng khi tạo đơn hàng).
export const findByUser = async (userId, { db = pool, lock = false } = {}) => {
  const [rows] = await db.execute(
    `SELECT ci.id, ci.months, ci.package_id,
            p.code, p.name, p.tier, p.price_per_month
       FROM cart_items ci
       JOIN packages p ON p.id = ci.package_id
      WHERE ci.user_id = ? AND p.is_active = 1
      ORDER BY p.tier
      ${lock ? 'FOR UPDATE' : ''}`,
    [userId],
  );
  return rows;
};

export const countByUser = async (userId) => {
  const [[row]] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM cart_items ci JOIN packages p ON p.id = ci.package_id
      WHERE ci.user_id = ? AND p.is_active = 1`,
    [userId],
  );
  return row.total;
};

// Chưa có gói này trong giỏ → thêm; đã có → cập nhật số tháng (nhờ UNIQUE(user_id, package_id))
export const upsert = async ({ userId, packageId, months }) => {
  await pool.execute(
    `INSERT INTO cart_items (user_id, package_id, months) VALUES (?, ?, ?) AS new_item
     ON DUPLICATE KEY UPDATE months = new_item.months`,
    [userId, packageId, months],
  );
};

// Luôn lọc theo user_id → không sửa/xóa được giỏ của người khác. Trả về số dòng bị ảnh hưởng.
export const updateMonths = async ({ id, userId, months }) => {
  const [result] = await pool.execute('UPDATE cart_items SET months = ? WHERE id = ? AND user_id = ?', [
    months,
    id,
    userId,
  ]);
  return result.affectedRows;
};

export const remove = async ({ id, userId }) => {
  const [result] = await pool.execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows;
};

// Sau khi thanh toán: xóa các gói vừa mua khỏi giỏ
export const removePackages = async ({ userId, packageIds }, db = pool) => {
  if (packageIds.length === 0) return;
  const placeholders = packageIds.map(() => '?').join(', ');
  await db.execute(`DELETE FROM cart_items WHERE user_id = ? AND package_id IN (${placeholders})`, [
    userId,
    ...packageIds,
  ]);
};
