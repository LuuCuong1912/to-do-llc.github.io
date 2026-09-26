import jwt from 'jsonwebtoken';
import env from '../config/env.js';

const ALGORITHM = 'HS256';

// Tạo token chứa id người dùng (sub = subject). Trả kèm thời điểm hết hạn để đặt cookie cùng hạn.
export const signToken = (userId) => {
  const token = jwt.sign({ sub: String(userId) }, env.jwt.secret, {
    algorithm: ALGORITHM,
    expiresIn: env.jwt.expiresIn,
  });
  const { exp } = jwt.decode(token);
  return { token, expiresAt: new Date(exp * 1000) };
};

// Ném lỗi nếu token sai chữ ký / hết hạn. Chỉ chấp nhận đúng thuật toán đã dùng để ký.
export const verifyToken = (token) => jwt.verify(token, env.jwt.secret, { algorithms: [ALGORITHM] });
