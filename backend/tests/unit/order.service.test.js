import { describe, it, expect, vi, beforeEach } from 'vitest';

// Transaction giả: chạy thẳng hàm với 1 "connection" rỗng
vi.mock('../../src/config/db.js', () => ({ default: {}, withTransaction: (work) => work({}) }));
vi.mock('../../src/models/order.model.js', () => ({ create: vi.fn(), findById: vi.fn(), markPaid: vi.fn() }));
vi.mock('../../src/models/order-item.model.js', () => ({ createMany: vi.fn(), findByOrderIds: vi.fn() }));
vi.mock('../../src/models/cart.model.js', () => ({ findByUser: vi.fn(), removePackages: vi.fn() }));
vi.mock('../../src/models/package.model.js', () => ({}));
vi.mock('../../src/services/subscription.service.js', () => ({ activateFromOrder: vi.fn() }));

const orderModel = await import('../../src/models/order.model.js');
const orderItemModel = await import('../../src/models/order-item.model.js');
const cartModel = await import('../../src/models/cart.model.js');
const subscriptionService = await import('../../src/services/subscription.service.js');
const orderService = await import('../../src/services/order.service.js');

beforeEach(() => vi.clearAllMocks());

describe('orderService.createFromCart', () => {
  it('giỏ trống → 400 CART_EMPTY, không tạo đơn', async () => {
    cartModel.findByUser.mockResolvedValue([]);
    await expect(orderService.createFromCart(1, { paymentMethod: 'mock' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'CART_EMPTY',
    });
    expect(orderModel.create).not.toHaveBeenCalled();
  });

  it('tạo đơn với tổng tiền tính từ giỏ + lưu tên, giá lúc mua; khóa giỏ khi đọc', async () => {
    cartModel.findByUser.mockResolvedValue([
      { id: 1, months: 6, package_id: 2, code: 'gold', name: 'Gold', tier: 2, price_per_month: 59000 },
    ]);
    orderModel.create.mockResolvedValue(10);
    orderModel.findById.mockResolvedValue({
      id: 10,
      user_id: 1,
      order_code: 'TD1',
      total_amount: 354000,
      status: 'pending',
    });
    orderItemModel.findByOrderIds.mockResolvedValue([]);

    await orderService.createFromCart(1, { paymentMethod: 'mock' });

    expect(cartModel.findByUser).toHaveBeenCalledWith(1, expect.objectContaining({ lock: true }));
    expect(orderModel.create.mock.calls[0][0]).toMatchObject({ userId: 1, totalAmount: 354000, paymentMethod: 'mock' });
    expect(orderItemModel.createMany.mock.calls[0][1]).toEqual([
      { packageId: 2, packageName: 'Gold', unitPrice: 59000, months: 6, subtotal: 354000 },
    ]);
  });
});

describe('orderService — kiểm tra đơn', () => {
  it('đơn của người khác hoặc không tồn tại → cùng 404', () => {
    expect(() => orderService.assertOwner(null, 1)).toThrow(expect.objectContaining({ code: 'ORDER_NOT_FOUND' }));
    expect(() => orderService.assertOwner({ user_id: 2 }, 1)).toThrow(expect.objectContaining({ statusCode: 404 }));
    expect(() => orderService.assertOwner({ user_id: 1 }, 1)).not.toThrow();
  });

  it('chỉ đơn pending mới thanh toán được', () => {
    expect(() => orderService.assertPayable({ status: 'paid' })).toThrow(
      expect.objectContaining({ code: 'ORDER_ALREADY_PAID' }),
    );
    expect(() => orderService.assertPayable({ status: 'failed' })).toThrow(
      expect.objectContaining({ code: 'ORDER_NOT_PAYABLE' }),
    );
    expect(() => orderService.assertPayable({ status: 'pending' })).not.toThrow();
  });
});

describe('orderService.markPaid', () => {
  it('đánh dấu đã trả tiền → kích hoạt gói → xóa đúng các gói vừa mua khỏi giỏ', async () => {
    const order = { id: 10, user_id: 1 };
    const items = [
      { package_id: 2, months: 6 },
      { package_id: 3, months: 1 },
    ];
    orderItemModel.findByOrderIds.mockResolvedValue(items);

    await orderService.markPaid({}, order);

    expect(orderModel.markPaid).toHaveBeenCalledWith(10, {});
    expect(subscriptionService.activateFromOrder).toHaveBeenCalledWith({}, order, items);
    expect(cartModel.removePackages).toHaveBeenCalledWith({ userId: 1, packageIds: [2, 3] }, {});
  });
});
