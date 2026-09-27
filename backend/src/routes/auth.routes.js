import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginLimiter } from '../middlewares/rate-limit.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

// ROUTE: URL + các lớp middleware (chạy từ trái qua phải) + controller
const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
