import pool from '../config/db.js';

// Thêm nhiều dòng trong 1 câu SQL: VALUES (?, ?, ...), (?, ?, ...)
export const createMany = async (orderId, items, db = pool) => {
  const placeholders = items.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
  const values = items.flatMap((item) => [
    orderId,
    item.packageId,
    item.packageName,
    item.unitPrice,
    item.months,
    item.subtotal,
  ]);
  await db.execute(
    `INSERT INTO order_items (order_id, package_id, package_name, unit_price, months, subtotal) VALUES ${placeholders}`,
    values,
  );
};

export const findByOrderIds = async (orderIds, db = pool) => {
  if (orderIds.length === 0) return [];
  const placeholders = orderIds.map(() => '?').join(', ');
  const [rows] = await db.execute(
    `SELECT id, order_id, package_id, package_name, unit_price, months, subtotal
       FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`,
    orderIds,
  );
  return rows;
};
