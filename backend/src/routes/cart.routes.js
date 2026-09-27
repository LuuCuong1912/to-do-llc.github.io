import { Router } from 'express';
import * as cartController from '../controllers/cart.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { addItemSchema, updateItemSchema } from '../validators/cart.validator.js';

const router = Router();

router.use(authenticate); // mọi route giỏ hàng đều cần đăng nhập

router.get('/', cartController.getCart);
router.post('/items', validate(addItemSchema), cartController.addItem);
router.patch('/items/:id', validate(updateItemSchema), cartController.updateItem);
router.delete('/items/:id', cartController.removeItem);

export default router;
