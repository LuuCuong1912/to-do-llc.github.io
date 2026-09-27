import { request } from './http.js';

// Chỉ gọi API — không đụng tới giao diện

export const register = ({ fullName, email, password }) =>
  request('/auth/register', { method: 'POST', body: { fullName, email, password } });

export const login = ({ email, password }) => request('/auth/login', { method: 'POST', body: { email, password } });

export const logout = () => request('/auth/logout', { method: 'POST' });

// → { user, currentPlan }
export const getMe = () => request('/auth/me');
