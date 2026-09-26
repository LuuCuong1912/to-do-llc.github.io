import { Router } from 'express';

const router = Router();

// Kiểm tra server còn sống
router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

// Các giai đoạn sau gắn thêm route của từng chức năng tại đây, ví dụ:
// router.use('/auth', authRoutes);
// router.use('/packages', packageRoutes);

export default router;
