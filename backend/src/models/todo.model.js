import pool from '../config/db.js';

const COLUMNS = 'id, text, completed, created_at, updated_at';

export const listByUser = async (userId) => {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM todos WHERE user_id = ? ORDER BY created_at, id`, [userId]);
  return rows;
};

export const countByUser = async (userId, db = pool) => {
  const [[row]] = await db.execute('SELECT COUNT(*) AS total FROM todos WHERE user_id = ?', [userId]);
  return row.total;
};

export const findByIdForUser = async (id, userId, db = pool) => {
  const [rows] = await db.execute(`SELECT ${COLUMNS} FROM todos WHERE id = ? AND user_id = ?`, [id, userId]);
  return rows[0] ?? null;
};

export const create = async ({ userId, text }, db = pool) => {
  const [result] = await db.execute('INSERT INTO todos (user_id, text) VALUES (?, ?)', [userId, text]);
  return result.insertId;
};

// Chỉ cập nhật các cột được truyền vào. Tên cột lấy từ danh sách cố định, KHÔNG lấy từ dữ liệu người dùng.
export const update = async ({ id, userId, text, completed }) => {
  const fields = [];
  const values = [];
  if (text !== undefined) {
    fields.push('text = ?');
    values.push(text);
  }
  if (completed !== undefined) {
    fields.push('completed = ?');
    values.push(completed ? 1 : 0);
  }
  if (fields.length === 0) return;

  await pool.execute(`UPDATE todos SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, [...values, id, userId]);
};

export const remove = async ({ id, userId }) => {
  const [result] = await pool.execute('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows;
};
