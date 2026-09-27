import { Router } from 'express';
import * as todoController from '../controllers/todo.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireSubscription } from '../middlewares/subscription.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createTodoSchema, updateTodoSchema } from '../validators/todo.validator.js';

const router = Router();

// 2 lớp kiểm tra cho mọi route: đã đăng nhập? → đã mua gói còn hạn?
router.use(authenticate, requireSubscription);

router.get('/', todoController.list);
router.post('/', validate(createTodoSchema), todoController.create);
router.patch('/:id', validate(updateTodoSchema), todoController.update);
router.delete('/:id', todoController.remove);

export default router;
