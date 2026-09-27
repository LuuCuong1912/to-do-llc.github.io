import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/methods', paymentController.methods);

router.post('/mock/:orderId', authenticate, paymentController.payMock);
router.post('/vnpay/:orderId', authenticate, paymentController.createVnpayUrl);

// VNPay gọi — không có cookie đăng nhập, bảo vệ bằng CHỮ KÝ HMAC trong service
router.get('/vnpay/return', paymentController.vnpayReturn);
router.get('/vnpay/ipn', paymentController.vnpayIpn);

export default router;
