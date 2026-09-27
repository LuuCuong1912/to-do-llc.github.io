import { Router } from 'express';
import * as packageController from '../controllers/package.controller.js';

// Công khai — landing page gọi khi chưa đăng nhập
const router = Router();

router.get('/', packageController.list);
router.get('/:code', packageController.getByCode);

export default router;
