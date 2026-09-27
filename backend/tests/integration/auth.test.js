import { describe, it, expect, afterAll } from 'vitest';
import { newUser, guest, cleanup, pool, TEST_EMAIL_DOMAIN } from './helpers.js';

afterAll(async () => {
  await cleanup();
  await pool.end();
});

describe('Xác thực (MySQL thật)', () => {
  it('đăng ký → có cookie httpOnly → /me trả thông tin, chưa có gói, giỏ trống', async () => {
    const { agent, email } = await newUser('auth');
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data).toMatchObject({ user: { email }, currentPlan: null, cartCount: 0 });
  });

  it('email trùng (khác hoa/thường) → 409', async () => {
    const { email } = await newUser('dup');
    const res = await guest()
      .post('/api/auth/register')
      .send({ fullName: 'Khác', email: email.toUpperCase(), password: 'matkhau123' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('3 request đăng ký cùng email cùng lúc → đúng 1 thành công', async () => {
    const email = `race${Date.now()}${TEST_EMAIL_DOMAIN}`;
    const results = await Promise.all(
      [1, 2, 3].map(() => guest().post('/api/auth/register').send({ fullName: 'Race', email, password: 'matkhau123' })),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 409, 409]);
  });

  it('tiếng Việt + emoji lưu đúng, mật khẩu lưu dạng bcrypt', async () => {
    const { id } = await newUser('vi');
    await pool.query('UPDATE users SET full_name = ? WHERE id = ?', ['Trần Thị Bình 😀', id]);
    const [[row]] = await pool.query('SELECT full_name, password_hash FROM users WHERE id = ?', [id]);
    expect(row.full_name).toBe('Trần Thị Bình 😀');
    expect(row.password_hash).toMatch(/^\$2b\$10\$.{53}$/);
  });

  it('đăng xuất → /me 401; đăng nhập lại (email viết hoa) → 200', async () => {
    const { agent, email } = await newUser('out');
    await agent.post('/api/auth/logout');
    expect((await agent.get('/api/auth/me')).status).toBe(401);
    const login = await agent.post('/api/auth/login').send({ email: email.toUpperCase(), password: 'matkhau123' });
    expect(login.status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(200);
  });

  it('sai mật khẩu và email không tồn tại → cùng thông báo 401', async () => {
    const { email } = await newUser('wrong');
    const a = await guest().post('/api/auth/login').send({ email, password: 'saimatkhau1' });
    const b = await guest()
      .post('/api/auth/login')
      .send({ email: `khong-co${TEST_EMAIL_DOMAIN}`, password: 'saimatkhau1' });
    expect(a.status).toBe(401);
    expect(b.body.error).toEqual(a.body.error);
  });
});
