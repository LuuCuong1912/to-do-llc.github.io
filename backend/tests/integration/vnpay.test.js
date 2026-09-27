import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { newUser, guest, getPackages, signedQuery, cleanup, pool } from './helpers.js';

let pk;
beforeAll(async () => {
  pk = await getPackages();
});
afterAll(async () => {
  await cleanup();
  await pool.end();
});

// Tạo đơn VNPay và lấy URL thanh toán → trả về các tham số trong URL
const startVnpay = async (agent, packageId) => {
  await agent.post('/api/cart/items').send({ packageId, months: 1 });
  const order = (await agent.post('/api/orders').send({ paymentMethod: 'vnpay' })).body.data.order;
  const { paymentUrl } = (await agent.post(`/api/payments/vnpay/${order.id}`)).body.data;
  return { order, url: new URL(paymentUrl), query: Object.fromEntries(new URL(paymentUrl).searchParams) };
};

const ipnParams = (q, overrides = {}) => ({
  vnp_TxnRef: q.vnp_TxnRef,
  vnp_Amount: q.vnp_Amount,
  vnp_ResponseCode: '00',
  vnp_TransactionStatus: '00',
  vnp_TransactionNo: '14000001',
  vnp_TmnCode: q.vnp_TmnCode,
  ...overrides,
});

const ipn = async (params) => (await guest().get('/api/payments/vnpay/ipn').query(signedQuery(params))).body;

describe('VNPay sandbox — khóa giả (MySQL thật)', () => {
  it('URL thanh toán: đúng sandbox, số tiền ×100, chữ ký khớp cách ký của VNPay', async () => {
    const { agent } = await newUser('vnp');
    const { order, url, query } = await startVnpay(agent, pk.pro.id);
    expect(url.origin).toBe('https://sandbox.vnpayment.vn');
    expect(query.vnp_Amount).toBe(String(order.totalAmount * 100));
    expect(query.vnp_TxnRef.startsWith(order.orderCode)).toBe(true);
    const { vnp_SecureHash, ...unsigned } = query;
    expect(signedQuery(unsigned).vnp_SecureHash).toBe(vnp_SecureHash);
  });

  it('IPN: sai chữ ký 97 · sai tiền 04 · mã lạ 01 · thành công 00 · gửi lại 02', async () => {
    const { agent } = await newUser('ipn');
    const { order, query } = await startVnpay(agent, pk.pro.id);
    const base = ipnParams(query);

    const tampered = { ...signedQuery(base), vnp_Amount: '100' };
    expect((await guest().get('/api/payments/vnpay/ipn').query(tampered)).body.RspCode).toBe('97');
    expect((await ipn({ ...base, vnp_Amount: '100' })).RspCode).toBe('04');
    expect((await ipn({ ...base, vnp_TxnRef: 'KHONGTONTAI' })).RspCode).toBe('01');
    expect((await ipn(base)).RspCode).toBe('00');
    expect((await ipn(base)).RspCode).toBe('02');

    expect((await agent.get(`/api/orders/${order.id}`)).body.data.order.status).toBe('paid');
    expect((await agent.get('/api/auth/me')).body.data.currentPlan.code).toBe('pro');
    const [[payment]] = await pool.query('SELECT status FROM payments WHERE transaction_ref = ?', [query.vnp_TxnRef]);
    expect(payment.status).toBe('success');
  });

  it('khách hủy trên VNPay (mã 24) → đơn failed, giỏ hàng vẫn còn', async () => {
    const { agent } = await newUser('vcancel');
    const { order, query } = await startVnpay(agent, pk.gold.id);
    expect((await ipn(ipnParams(query, { vnp_ResponseCode: '24', vnp_TransactionStatus: '02' }))).RspCode).toBe('00');
    expect((await agent.get(`/api/orders/${order.id}`)).body.data.order.status).toBe('failed');
    expect((await agent.get('/api/cart')).body.data.cart.itemCount).toBe(1);
  });

  it('link VNPay còn hiệu lực → không cho hủy đơn (PAYMENT_IN_PROGRESS)', async () => {
    const { agent } = await newUser('vbusy');
    const { order } = await startVnpay(agent, pk.basic.id);
    expect((await agent.patch(`/api/orders/${order.id}/cancel`)).body.error.code).toBe('PAYMENT_IN_PROGRESS');
  });

  it('Return URL: chữ ký đúng → về trang kết quả; chữ ký giả → gateway=invalid', async () => {
    const { agent } = await newUser('vret');
    const { order, query } = await startVnpay(agent, pk.basic.id);
    const ok = await guest()
      .get('/api/payments/vnpay/return')
      .query(signedQuery(ipnParams(query)));
    const okUrl = new URL(ok.headers.location);
    expect(ok.status).toBe(302);
    expect(okUrl.pathname).toBe('/pages/payment-result.html');
    expect(okUrl.searchParams.get('orderId')).toBe(String(order.id));

    const bad = await guest()
      .get('/api/payments/vnpay/return')
      .query({ vnp_TxnRef: query.vnp_TxnRef, vnp_SecureHash: 'abc' });
    expect(new URL(bad.headers.location).searchParams.get('gateway')).toBe('invalid');
  });
});
