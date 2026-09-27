import pool from '../config/db.js';

const COLUMNS = 'id, code, name, description, price_per_month, max_tasks, tier, features';

export const findAllActive = async () => {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM packages WHERE is_active = 1 ORDER BY tier`);
  return rows;
};

export const findActiveByCode = async (code) => {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM packages WHERE code = ? AND is_active = 1`, [code]);
  return rows[0] ?? null;
};

export const findActiveById = async (id, db = pool) => {
  const [rows] = await db.execute(`SELECT ${COLUMNS} FROM packages WHERE id = ? AND is_active = 1`, [id]);
  return rows[0] ?? null;
};
