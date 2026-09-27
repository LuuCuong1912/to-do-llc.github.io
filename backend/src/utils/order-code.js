import crypto from 'node:crypto';

// Bỏ các ký tự dễ nhầm (0/O, 1/I/L) để khách đọc mã đơn qua điện thoại không bị sai
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const randomCode = (length) =>
  Array.from(crypto.randomBytes(length), (byte) => ALPHABET[byte % ALPHABET.length]).join('');

// VD: TD260926K7Q2XM — "TD" + ngày yymmdd + 6 ký tự ngẫu nhiên (chỉ chữ và số, hợp lệ với VNPay)
export const generateOrderCode = (date = new Date()) => {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `TD${yy}${mm}${dd}${randomCode(6)}`;
};
