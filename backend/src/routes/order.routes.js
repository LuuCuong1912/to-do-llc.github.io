import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createOrderSchema } from '../validators/order.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createOrderSchema), orderController.create);
router.get('/', orderController.list);
router.get('/:id', orderController.getById);

export default router;
