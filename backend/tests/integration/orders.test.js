import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { newUser, getPackages, buyPlan, cleanup, pool } from './helpers.js';

let pk;
beforeAll(async () => {
  pk = await getPackages();
});
afterAll(async () => {
  await cleanup();
  await pool.end();
});

const createOrder = async (agent, paymentMethod = 'mock') =>
  (await agent.post('/api/orders').send({ paymentMethod })).body.data.order;

describe('Đơn hàng + thanh toán giả lập (MySQL thật)', () => {
  it('giỏ trống → 400 CART_EMPTY', async () => {
    const { agent } = await newUser('empty');
    const res = await agent.post('/api/orders').send({ paymentMethod: 'mock' });
    expect(res.body.error.code).toBe('CART_EMPTY');
  });

  it('tạo đơn (pending, có hạn chót) → thanh toán → paid, kích hoạt gói, giỏ trống', async () => {
    const { agent } = await newUser('pay');
    await agent.post('/api/cart/items').send({ packageId: pk.gold.id, months: 6 });
    const order = await createOrder(agent);
    expect(order).toMatchObject({ status: 'pending', totalAmount: pk.gold.pricePerMonth * 6 });
    expect(order.orderCode).toMatch(/^TD\d{6}[A-Z2-9]{6}$/);
    expect(order.expiresAt).toBeTruthy();
    expect(order.items[0]).toMatchObject({ packageName: 'Gold', unitPrice: pk.gold.pricePerMonth });

    const paid = await agent.post(`/api/payments/mock/${order.id}`);
    expect(paid.body.data.order.status).toBe('paid');
    const me = (await agent.get('/api/auth/me')).body.data;
    expect(me.currentPlan.code).toBe('gold');
    expect(me.cartCount).toBe(0);
    expect((await agent.post(`/api/payments/mock/${order.id}`)).body.error.code).toBe('ORDER_ALREADY_PAID');
  });

  it('3 request thanh toán cùng lúc → chỉ 1 thành công, chỉ 1 subscription', async () => {
    const { agent } = await newUser('race');
    await agent.post('/api/cart/items').send({ packageId: pk.basic.id, months: 1 });
    const order = await createOrder(agent);
    const results = await Promise.all([1, 2, 3].map(() => agent.post(`/api/payments/mock/${order.id}`)));
    expect(results.map((r) => r.status).sort()).toEqual([200, 409, 409]);
    const [[row]] = await pool.query('SELECT COUNT(*) n FROM subscriptions WHERE order_id = ?', [order.id]);
    expect(row.n).toBe(1);
  });

  it('mua thêm cùng gói khi còn hạn → thời hạn nối tiếp; có 2 gói → dùng gói tier cao hơn', async () => {
    const { agent, id } = await newUser('renew');
    await buyPlan(agent, pk.gold.id, 1);
    const second = await buyPlan(agent, pk.gold.id, 1);
    const [[prev]] = await pool.query(
      'SELECT MAX(end_at) e FROM subscriptions WHERE user_id = ? AND order_id <> ? AND package_id = ?',
      [id, second.id, pk.gold.id],
    );
    const [[next]] = await pool.query('SELECT start_at s FROM subscriptions WHERE order_id = ?', [second.id]);
    expect(next.s.getTime()).toBe(prev.e.getTime());

    await buyPlan(agent, pk.basic.id, 1);
    expect((await agent.get('/api/auth/me')).body.data.currentPlan.code).toBe('gold');
  });

  it('người khác xem / thanh toán / hủy đơn của mình → 404', async () => {
    const a = await newUser('oa');
    const b = await newUser('ob');
    await a.agent.post('/api/cart/items').send({ packageId: pk.pro.id, months: 1 });
    const order = await createOrder(a.agent);
    expect((await b.agent.get(`/api/orders/${order.id}`)).status).toBe(404);
    expect((await b.agent.post(`/api/payments/mock/${order.id}`)).status).toBe(404);
    expect((await b.agent.patch(`/api/orders/${order.id}/cancel`)).status).toBe(404);
  });
});

describe('Không tạo đơn trùng, hủy đơn, hết hạn', () => {
  it('cùng giỏ + cùng phương thức → dùng lại đơn; đổi giỏ → đơn mới', async () => {
    const { agent } = await newUser('reuse');
    await agent.post('/api/cart/items').send({ packageId: pk.gold.id, months: 3 });
    const first = await createOrder(agent);
    expect((await createOrder(agent)).id).toBe(first.id);
    await agent.post('/api/cart/items').send({ packageId: pk.gold.id, months: 6 });
    expect((await createOrder(agent)).id).not.toBe(first.id);
  });

  it('hủy đơn pending → cancelled; hủy lại / thanh toán đơn đã hủy → 409', async () => {
    const { agent } = await newUser('cancel');
    await agent.post('/api/cart/items').send({ packageId: pk.basic.id, months: 1 });
    const order = await createOrder(agent);
    expect((await agent.patch(`/api/orders/${order.id}/cancel`)).body.data.order.status).toBe('cancelled');
    expect((await agent.patch(`/api/orders/${order.id}/cancel`)).body.error.code).toBe('ORDER_NOT_CANCELLABLE');
    expect((await agent.post(`/api/payments/mock/${order.id}`)).status).toBe(409);
  });

  it('đơn quá 30 phút → hiển thị cancelled, thanh toán 409 ORDER_EXPIRED, danh sách tự cập nhật DB', async () => {
    const { agent } = await newUser('expire');
    await agent.post('/api/cart/items').send({ packageId: pk.basic.id, months: 1 });
    const order = await createOrder(agent);
    await pool.query('UPDATE orders SET created_at = NOW() - INTERVAL 31 MINUTE WHERE id = ?', [order.id]);

    const detail = (await agent.get(`/api/orders/${order.id}`)).body.data.order;
    expect(detail).toMatchObject({ status: 'cancelled', expiresAt: null });
    expect((await agent.post(`/api/payments/mock/${order.id}`)).body.error.code).toBe('ORDER_EXPIRED');

    await agent.get('/api/orders');
    const [[row]] = await pool.query('SELECT status FROM orders WHERE id = ?', [order.id]);
    expect(row.status).toBe('cancelled');
  });
});
