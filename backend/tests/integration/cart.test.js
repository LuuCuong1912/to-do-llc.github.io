import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { newUser, guest, getPackages, cleanup, pool } from './helpers.js';

let pk;
beforeAll(async () => {
  pk = await getPackages();
});
afterAll(async () => {
  await cleanup();
  await pool.end();
});

describe('Gói + giỏ hàng (MySQL thật)', () => {
  it('GET /packages → 3 gói theo tier, features là mảng, kèm monthOptions', async () => {
    const res = await guest().get('/api/packages');
    expect(res.body.data.packages.map((p) => p.code)).toEqual(['basic', 'gold', 'pro']);
    expect(Array.isArray(res.body.data.packages[1].features)).toBe(true);
    expect(res.body.data.monthOptions).toEqual([1, 3, 6, 12]);
  });

  it('chưa đăng nhập → 401', async () => {
    expect((await guest().get('/api/cart')).status).toBe(401);
  });

  it('thêm lại cùng gói → cập nhật số tháng, giá luôn lấy từ DB (bỏ qua "price" gửi lên)', async () => {
    const { agent } = await newUser('cart');
    await agent.post('/api/cart/items').send({ packageId: pk.basic.id, months: 1 });
    await agent.post('/api/cart/items').send({ packageId: pk.gold.id, months: 3 });
    const res = await agent.post('/api/cart/items').send({ packageId: pk.gold.id, months: 6, price: 1 });
    const { cart } = res.body.data;
    expect(res.status).toBe(201);
    expect(cart.itemCount).toBe(2);
    expect(cart.items.find((i) => i.package.code === 'gold').months).toBe(6);
    expect(cart.totalAmount).toBe(pk.basic.pricePerMonth + pk.gold.pricePerMonth * 6);
    expect(cart.monthOptions).toEqual([1, 3, 6, 12]);
  });

  it('dữ liệu sai → 400 / 404', async () => {
    const { agent } = await newUser('cartbad');
    expect((await agent.post('/api/cart/items').send({ packageId: pk.gold.id, months: 5 })).status).toBe(400);
    expect((await agent.post('/api/cart/items').send({ packageId: 99999, months: 1 })).status).toBe(404);
  });

  it('user khác không sửa / xóa được giỏ của mình → 404', async () => {
    const a = await newUser('owner');
    const b = await newUser('other');
    const itemId = (await a.agent.post('/api/cart/items').send({ packageId: pk.pro.id, months: 1 })).body.data.cart
      .items[0].id;
    expect((await b.agent.patch(`/api/cart/items/${itemId}`).send({ months: 12 })).status).toBe(404);
    expect((await b.agent.delete(`/api/cart/items/${itemId}`)).status).toBe(404);
    expect((await a.agent.delete(`/api/cart/items/${itemId}`)).body.data.cart.itemCount).toBe(0);
  });
});
