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

export default pool;
