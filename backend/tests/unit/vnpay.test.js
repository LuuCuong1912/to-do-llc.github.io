import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { buildQuery, sign, verifySignature, formatVnDate } from '../../src/services/payment/vnpay.service.js';

const SECRET = 'test-hash-secret';

// Ký theo đúng code mẫu Node.js của VNPay (sortObject + qs.stringify encode:false) — cài đặt độc lập để đối chiếu
const officialSign = (params) => {
  const data = Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&');
  return crypto.createHmac('sha512', SECRET).update(Buffer.from(data, 'utf-8')).digest('hex');
};

const signed = (params) => ({ ...params, vnp_SecureHash: officialSign(params) });

describe('VNPay — chữ ký', () => {
  it('sắp xếp tham số A→Z, mã hóa dấu cách thành "+" và bỏ giá trị rỗng', () => {
    expect(buildQuery({ vnp_B: 'a b', vnp_A: '1', vnp_C: '' })).toBe('vnp_A=1&vnp_B=a+b');
  });

  it('chữ ký trùng khớp với cách ký của code mẫu VNPay', () => {
    const params = { vnp_Amount: '9900000', vnp_OrderInfo: 'Thanh toan don hang TD1', vnp_TxnRef: 'TD1ABCD' };
    expect(sign(buildQuery(params), SECRET)).toBe(officialSign(params));
  });

  it('chấp nhận dữ liệu có chữ ký đúng (kể cả chữ ký viết HOA và có vnp_SecureHashType)', () => {
    const query = signed({ vnp_Amount: '100', vnp_TxnRef: 'X' });
    expect(verifySignature(query, SECRET)).toBe(true);
    expect(verifySignature({ ...query, vnp_SecureHash: query.vnp_SecureHash.toUpperCase() }, SECRET)).toBe(true);
    expect(verifySignature({ ...query, vnp_SecureHashType: 'SHA512' }, SECRET)).toBe(true);
  });

  it('từ chối khi bị sửa dữ liệu, sai khóa, thiếu hoặc sai định dạng chữ ký', () => {
    const query = signed({ vnp_Amount: '100', vnp_TxnRef: 'X' });
    expect(verifySignature({ ...query, vnp_Amount: '1' }, SECRET)).toBe(false);
    expect(verifySignature(query, 'khoa-khac')).toBe(false);
    expect(verifySignature({ vnp_Amount: '100' }, SECRET)).toBe(false);
    expect(verifySignature({ ...query, vnp_SecureHash: 'not-hex!' }, SECRET)).toBe(false);
  });

  it('bỏ qua tham số không bắt đầu bằng vnp_ khi kiểm tra', () => {
    const query = signed({ vnp_Amount: '100' });
    expect(verifySignature({ ...query, utm_source: 'facebook' }, SECRET)).toBe(true);
  });
});

describe('VNPay — định dạng ngày', () => {
  it('đổi sang giờ Việt Nam (GMT+7), dạng yyyyMMddHHmmss', () => {
    expect(formatVnDate(new Date('2026-09-26T17:05:09Z'))).toBe('20260927000509');
  });
});
