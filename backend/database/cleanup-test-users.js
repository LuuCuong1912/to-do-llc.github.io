// Xóa dữ liệu của các tài khoản test (theo đuôi email) — dùng sau khi chạy test e2e / tích hợp trên DB dev.
//   npm run db:cleanup-tests              → xóa email đuôi @e2e.test và @it.test
//   node database/cleanup-test-users.js @abc.test
import pool from '../src/config/db.js';

const domains = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['@e2e.test', '@it.test'];

const run = async () => {
  const [users] = await pool.query(`SELECT id FROM users WHERE ${domains.map(() => 'email LIKE ?').join(' OR ')}`, [
    ...domains.map((d) => `%${d}`),
  ]);
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    // Thứ tự theo khóa ngoại: subscriptions/payments → orders → users (cart_items, todos tự xóa theo CASCADE)
    await pool.query('DELETE FROM subscriptions WHERE user_id IN (?)', [ids]);
    await pool.query('DELETE p FROM payments p JOIN orders o ON o.id = p.order_id WHERE o.user_id IN (?)', [ids]);
    await pool.query('DELETE FROM orders WHERE user_id IN (?)', [ids]);
    await pool.query('DELETE FROM users WHERE id IN (?)', [ids]);
  }
  console.log(`🧹 Đã xóa ${ids.length} tài khoản test (${domains.join(', ')})`);
};

run()
  .catch((err) => {
    console.error(`❌ ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
