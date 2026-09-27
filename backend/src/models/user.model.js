import pool from '../config/db.js';

// MODEL: chỉ chạy SQL và trả về dòng dữ liệu. Không chứa logic nghiệp vụ.

// Có password_hash — chỉ dùng khi đăng nhập
export const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT id, full_name, email, password_hash, created_at FROM users WHERE email = ?',
    [email],
  );
  return rows[0] ?? null;
};

// Không lấy password_hash
export const findById = async (id) => {
  const [rows] = await pool.execute('SELECT id, full_name, email, created_at FROM users WHERE id = ?', [id]);
  return rows[0] ?? null;
};

// Khóa dòng user tới hết transaction → các request cùng user phải xếp hàng (dùng khi kiểm tra giới hạn số việc)
export const lockById = async (id, db) => {
  await db.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [id]);
};

export const create = async ({ fullName, email, passwordHash }, db = pool) => {
  const [result] = await db.execute('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)', [
    fullName,
    email,
    passwordHash,
  ]);
  return result.insertId;
};
