import crypto from 'node:crypto';
import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/db.js';

export const TEST_EMAIL_DOMAIN = '@it.test';
export { pool };

let counter = 0;

// Người dùng mới đã đăng nhập: agent tự giữ cookie giữa các request
export const newUser = async (prefix = 'u') => {
  const agent = request.agent(app);
  const email = `${prefix}${Date.now()}${counter++}${TEST_EMAIL_DOMAIN}`;
  const res = await agent
    .post('/api/auth/register')
    .send({ fullName: `Test ${prefix}`, email, password: 'matkhau123' });
  if (res.status !== 201) throw new Error(`Không tạo được user test: ${JSON.stringify(res.body)}`);
  return { agent, email, id: res.body.data.user.id };
};

export const guest = () => request(app);

export const getPackages = async () => {
  const res = await request(app).get('/api/packages');
  return Object.fromEntries(res.body.data.packages.map((p) => [p.code, p]));
};

// Mua gói bằng thanh toán giả lập (đi qua đúng API như người dùng thật)
export const buyPlan = async (agent, packageId, months = 1) => {
  await agent.post('/api/cart/items').send({ packageId, months });
  const order = (await agent.post('/api/orders').send({ paymentMethod: 'mock' })).body.data.order;
  await agent.post(`/api/payments/mock/${order.id}`);
  return order;
};

// Ký dữ liệu giống VNPay (cài đặt ĐỘC LẬP theo code mẫu của VNPay) để giả lập IPN / Return URL
export const vnpaySign = (params) => {
  const data = Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&');
  return crypto.createHmac('sha512', process.env.VNP_HASH_SECRET).update(Buffer.from(data, 'utf-8')).digest('hex');
};

export const signedQuery = (params) => ({ ...params, vnp_SecureHash: vnpaySign(params) });

// Xóa mọi dữ liệu của user test (thứ tự theo khóa ngoại)
export const cleanup = async () => {
  const [users] = await pool.query('SELECT id FROM users WHERE email LIKE ?', [`%${TEST_EMAIL_DOMAIN}`]);
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;
  await pool.query('DELETE FROM subscriptions WHERE user_id IN (?)', [ids]);
  await pool.query('DELETE p FROM payments p JOIN orders o ON o.id = p.order_id WHERE o.user_id IN (?)', [ids]);
  await pool.query('DELETE FROM orders WHERE user_id IN (?)', [ids]);
  await pool.query('DELETE FROM users WHERE id IN (?)', [ids]);
};
