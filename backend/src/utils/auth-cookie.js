import env from '../config/env.js';

export const AUTH_COOKIE = 'token';

// httpOnly: JavaScript trên trình duyệt không đọc được cookie → chống bị đánh cắp token qua XSS
const cookieOptions = {
  httpOnly: true,
  sameSite: env.cookieSameSite,
  secure: env.isProduction || env.cookieSameSite === 'none', // production chạy HTTPS; SameSite=None bắt buộc Secure
  path: '/',
};

export const setAuthCookie = (res, token, expiresAt) => {
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, expires: expiresAt });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
};
