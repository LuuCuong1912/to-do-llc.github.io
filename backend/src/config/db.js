import mysql from 'mysql2/promise';
import env from './env.js';

// Pool = "bể" kết nối dùng chung: mỗi truy vấn mượn 1 kết nối rồi trả lại,
// nhanh hơn nhiều so với mở/đóng kết nối mới cho mỗi request.
// Các model import `pool` và luôn dùng câu lệnh có tham số:
//   pool.execute('SELECT * FROM users WHERE email = ?', [email])
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

export const checkConnection = async () => {
  await pool.query('SELECT 1');
};

// Chạy nhiều câu SQL trong 1 TRANSACTION: tất cả cùng thành công, hoặc lỗi 1 câu thì hoàn tác hết.
// Model nhận `conn` làm tham số cuối để chạy trong transaction này.
//   await withTransaction(async (conn) => { await orderModel.create(data, conn); ... });
export const withTransaction = async (work) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export default pool;
