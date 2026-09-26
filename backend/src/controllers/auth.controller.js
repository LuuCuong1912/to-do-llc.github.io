import * as authService from '../services/auth.service.js';
import { setAuthCookie, clearAuthCookie } from '../utils/auth-cookie.js';

// CONTROLLER: đọc req → gọi service → trả res. Không viết SQL, không tính toán nghiệp vụ.

export const register = async (req, res) => {
  const { user, token, expiresAt } = await authService.register(req.body);
  setAuthCookie(res, token, expiresAt); // đăng ký xong là đăng nhập luôn
  res.status(201).json({ success: true, data: { user } });
};

export const login = async (req, res) => {
  const { user, token, expiresAt } = await authService.login(req.body);
  setAuthCookie(res, token, expiresAt);
  res.json({ success: true, data: { user } });
};

export const logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, data: null });
};

export const me = async (req, res) => {
  const profile = await authService.getProfile(req.user.id);
  res.json({ success: true, data: profile });
};
