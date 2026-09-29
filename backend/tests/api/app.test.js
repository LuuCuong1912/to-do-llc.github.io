import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

// Các test này dừng ở lớp middleware (chưa đụng tới DB) → chạy được không cần MySQL

describe('App — cấu hình chung', () => {
  it('GET /api/health → 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('route không tồn tại → 404 JSON thống nhất', async () => {
    const res = await request(app).get('/api/khong-co');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });

  it('JSON sai cú pháp → 400 INVALID_JSON', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"a":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('có header bảo mật (helmet) và CORS cho Frontend', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://127.0.0.1:5500');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5500');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('Middleware authenticate', () => {
  it.each(['/api/cart', '/api/orders', '/api/todos', '/api/auth/me'])('%s chưa đăng nhập → 401', async (url) => {
    const res = await request(app).get(url);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('token giả → 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'token=abc.def.ghi');
    expect(res.status).toBe(401);
  });
});

describe('Middleware validate', () => {
  it('đăng ký thiếu dữ liệu → 400 kèm lỗi từng ô bằng tiếng Việt', async () => {
    const res = await request(app).post('/api/auth/register').send({ fullName: 'A', email: 'x', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.field)).toEqual(
      expect.arrayContaining(['fullName', 'email', 'password']),
    );
    expect(res.body.error.details[0].message).toMatch(/[ạ-ỹ]/);
  });
});

describe('Thanh toán', () => {
  it('GET /api/payments/methods → mock + vnpay', async () => {
    const res = await request(app).get('/api/payments/methods');
    expect(res.body.data.methods.map((m) => m.code)).toEqual(['mock', 'vnpay']);
  });

  it('VNPay sandbox → kèm cờ sandbox + thẻ test công khai để người xem demo thử', async () => {
    const res = await request(app).get('/api/payments/methods');
    const vnpay = res.body.data.methods.find((m) => m.code === 'vnpay');
    expect(vnpay).toMatchObject({ enabled: true, sandbox: true, testCard: { bank: 'NCB', otp: '123456' } });
    expect(JSON.stringify(res.body)).not.toContain('test-hash-secret'); // không bao giờ lộ chuỗi bí mật
  });

  it('IPN chữ ký sai → RspCode 97 (từ chối trước khi đụng DB)', async () => {
    const res = await request(app)
      .get('/api/payments/vnpay/ipn')
      .query({ vnp_TxnRef: 'X', vnp_Amount: '100', vnp_SecureHash: 'ab' });
    expect(res.body).toEqual({ RspCode: '97', Message: 'Invalid signature' });
  });
});
