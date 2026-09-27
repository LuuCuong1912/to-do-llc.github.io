import bcrypt from 'bcrypt';
import ApiError from '../utils/ApiError.js';
import { signToken } from '../utils/jwt.js';
import * as userModel from '../models/user.model.js';
import { getCurrentPlan } from './subscription.service.js';
import { countItems as countCartItems } from './cart.service.js';

const SALT_ROUNDS = 10;

// Hash giả để so sánh khi email không tồn tại: thời gian phản hồi giống hệt trường hợp sai mật khẩu,
// kẻ tấn công không đo được thời gian để đoán email nào đã đăng ký.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', SALT_ROUNDS);

// DB dùng snake_case, API trả về camelCase. Không bao giờ trả password_hash ra ngoài.
const toPublicUser = (row) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  createdAt: row.created_at,
});

export const register = async ({ fullName, email, password }) => {
  if (await userModel.findByEmail(email)) {
    throw new ApiError(409, 'EMAIL_TAKEN', 'Email này đã được đăng ký');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let userId;
  try {
    userId = await userModel.create({ fullName, email, passwordHash });
  } catch (err) {
    // 2 request đăng ký cùng email đến cùng lúc: cả hai qua được bước kiểm tra ở trên,
    // UNIQUE(email) trong DB chặn request thứ hai
    if (err.code === 'ER_DUP_ENTRY') throw new ApiError(409, 'EMAIL_TAKEN', 'Email này đã được đăng ký');
    throw err;
  }

  const user = await userModel.findById(userId);
  return { user: toPublicUser(user), ...signToken(userId) };
};

export const login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);
  const isMatch = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

  // Cùng một thông báo cho "sai email" và "sai mật khẩu"
  if (!user || !isMatch) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
  }

  return { user: toPublicUser(user), ...signToken(user.id) };
};

export const getProfile = async (userId) => {
  const user = await userModel.findById(userId);
  // Token còn hạn nhưng user đã bị xóa
  if (!user) throw new ApiError(401, 'UNAUTHENTICATED', 'Phiên đăng nhập không hợp lệ');

  // Navbar cần: tên, gói đang dùng, số món trong giỏ → gộp vào 1 request
  const [currentPlan, cartCount] = await Promise.all([getCurrentPlan(userId), countCartItems(userId)]);
  return { user: toPublicUser(user), currentPlan, cartCount };
};
