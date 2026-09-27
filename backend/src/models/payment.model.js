import pool from '../config/db.js';

const toJson = (value) => (value == null ? null : JSON.stringify(value));

export const create = async (
  { orderId, provider, transactionRef = null, amount, status, rawResponse = null },
  db = pool,
) => {
  const [result] = await db.execute(
    `INSERT INTO payments (order_id, provider, transaction_ref, amount, status, raw_response)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [orderId, provider, transactionRef, amount, status, toJson(rawResponse)],
  );
  return result.insertId;
};

export const findByProviderRef = async ({ provider, transactionRef }, { db = pool, lock = false } = {}) => {
  const [rows] = await db.execute(
    `SELECT id, order_id, provider, transaction_ref, amount, status
       FROM payments WHERE provider = ? AND transaction_ref = ? ${lock ? 'FOR UPDATE' : ''}`,
    [provider, transactionRef],
  );
  return rows[0] ?? null;
};

export const updateResult = async ({ id, status, rawResponse }, db = pool) => {
  await db.execute('UPDATE payments SET status = ?, raw_response = ? WHERE id = ?', [status, toJson(rawResponse), id]);
};
