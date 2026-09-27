import ApiError from '../utils/ApiError.js';
import { getCurrentPlan } from '../services/subscription.service.js';

// Đặt SAU authenticate. Chưa có gói còn hạn → 403. Có → gắn req.plan cho controller/service dùng.
export const requireSubscription = async (req, res, next) => {
  const plan = await getCurrentPlan(req.user.id);
  if (!plan) {
    return next(new ApiError(403, 'SUBSCRIPTION_REQUIRED', 'Bạn cần mua gói để sử dụng Todo App'));
  }
  req.plan = plan;
  next();
};
