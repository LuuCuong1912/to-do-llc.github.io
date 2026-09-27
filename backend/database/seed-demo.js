// Tạo tài khoản demo cho nhà tuyển dụng / người xem thử:
//   demo@todopro.vn / Demo@12345 — gói Pro 12 tháng (đơn hàng đã thanh toán giả lập) + vài công việc mẫu
// Chạy: npm run db:seed-demo   (đã có tài khoản thì bỏ qua)
import bcrypt from 'bcrypt';
import pool, { withTransaction } from '../src/config/db.js';
import { generateOrderCode } from '../src/utils/order-code.js';
import * as userModel from '../src/models/user.model.js';
import * as packageModel from '../src/models/package.model.js';
import * as orderModel from '../src/models/order.model.js';
import * as orderItemModel from '../src/models/order-item.model.js';
import * as paymentModel from '../src/models/payment.model.js';
import * as subscriptionModel from '../src/models/subscription.model.js';
import * as todoModel from '../src/models/todo.model.js';

const DEMO = { fullName: 'Tài khoản Demo', email: 'demo@todopro.vn', password: 'Demo@12345' };
const MONTHS = 12;
const TODOS = [
  ['Thiết kế cơ sở dữ liệu cho TodoPro', true],
  ['Viết API giỏ hàng và đơn hàng', true],
  ['Tích hợp thanh toán VNPay sandbox', false],
  ['Viết unit test cho service', false],
  ['Deploy lên Render', false],
];

const run = async () => {
  if (await userModel.findByEmail(DEMO.email)) {
    console.log(`ℹ️  Tài khoản ${DEMO.email} đã tồn tại — bỏ qua`);
    return;
  }

  const pro = await packageModel.findActiveByCode('pro');
  if (!pro) throw new Error('Chưa có gói Pro — hãy chạy "npm run db:setup" trước');

  const passwordHash = await bcrypt.hash(DEMO.password, 10);
  const total = pro.price_per_month * MONTHS;

  await withTransaction(async (conn) => {
    const userId = await userModel.create({ fullName: DEMO.fullName, email: DEMO.email, passwordHash }, conn);
    const orderId = await orderModel.create(
      { orderCode: generateOrderCode(), userId, totalAmount: total, paymentMethod: 'mock' },
      conn,
    );
    await orderItemModel.createMany(
      orderId,
      [{ packageId: pro.id, packageName: pro.name, unitPrice: pro.price_per_month, months: MONTHS, subtotal: total }],
      conn,
    );
    await paymentModel.create({ orderId, provider: 'mock', amount: total, status: 'success' }, conn);
    await orderModel.markPaid(orderId, conn);
    await subscriptionModel.create({ userId, packageId: pro.id, orderId, months: MONTHS }, conn);

    for (const [text, completed] of TODOS) {
      const todoId = await todoModel.create({ userId, text }, conn);
      if (completed) await conn.execute('UPDATE todos SET completed = 1 WHERE id = ?', [todoId]);
    }
  });

  console.log(`✅ Đã tạo tài khoản demo: ${DEMO.email} / ${DEMO.password} (gói Pro ${MONTHS} tháng)`);
};

run()
  .catch((err) => {
    console.error(`❌ ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
