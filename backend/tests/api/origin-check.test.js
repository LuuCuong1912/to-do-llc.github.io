import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

// Middleware checkOrigin chạy TRƯỚC route → kiểm tra được mà không cần DB (dùng /auth/logout, không đụng DB)
describe('Chống CSRF — kiểm tra header Origin', () => {
  it('POST từ trang lạ → 403 FORBIDDEN_ORIGIN', async () => {
    const res = await request(app).post('/api/auth/logout').set('Origin', 'https://trang-la.example');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN_ORIGIN');
  });

  it('POST từ Frontend của mình (CLIENT_URL) → cho qua', async () => {
    const res = await request(app).post('/api/auth/logout').set('Origin', 'http://127.0.0.1:5500');
    expect(res.status).toBe(200);
  });

  it('POST từ chính tên miền của server (SERVE_FRONTEND) → cho qua', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Host', 'todopro.example')
      .set('Origin', 'http://todopro.example');
    expect(res.status).toBe(200);
  });

  it('không có Origin (Postman, curl, VNPay IPN) → cho qua', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
  });

  it('GET từ trang lạ → cho qua (chỉ đọc, CORS đã chặn đọc phản hồi)', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://trang-la.example');
    expect(res.status).toBe(200);
  });
});
