import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// config/env.js đọc process.env lúc import → mỗi test đặt biến rồi import lại module
const loadEnv = async (vars) => {
  vi.resetModules();
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return (await import('../../src/config/env.js')).default;
};

const PEM = '-----BEGIN CERTIFICATE-----\nMIIBxx\n-----END CERTIFICATE-----';
const saved = { DB_SSL: process.env.DB_SSL, DB_SSL_CA: process.env.DB_SSL_CA };

beforeEach(() => vi.restoreAllMocks());
afterEach(() => loadEnv(saved));

describe('env.db.ssl — kết nối MySQL trên cloud', () => {
  it('không đặt DB_SSL → không dùng SSL (MySQL trên máy cá nhân)', async () => {
    const env = await loadEnv({ DB_SSL: undefined, DB_SSL_CA: undefined });
    expect(env.db.ssl).toBeUndefined();
  });

  it('DB_SSL=true, không có CA → bật SSL, vẫn kiểm tra chứng chỉ bằng CA của hệ thống', async () => {
    const env = await loadEnv({ DB_SSL: 'true', DB_SSL_CA: undefined });
    expect(env.db.ssl).toEqual({ rejectUnauthorized: true });
  });

  it('CA dán nhiều dòng → giữ nguyên', async () => {
    const env = await loadEnv({ DB_SSL: 'true', DB_SSL_CA: PEM });
    expect(env.db.ssl).toEqual({ rejectUnauthorized: true, ca: PEM });
  });

  it('CA dán 1 dòng với "\\n" → đổi thành xuống dòng thật', async () => {
    const env = await loadEnv({ DB_SSL: 'true', DB_SSL_CA: PEM.replace(/\n/g, '\\n') });
    expect(env.db.ssl.ca).toBe(PEM);
  });

  it('CA không phải PEM → dừng chương trình với thông báo rõ ràng', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(loadEnv({ DB_SSL: 'true', DB_SSL_CA: 'abc' })).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
  });
});
