import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/models/cart.model.js', () => ({
  findByUser: vi.fn(),
  upsert: vi.fn(),
  updateMonths: vi.fn(),
  remove: vi.fn(),
  countByUser: vi.fn(),
}));
vi.mock('../../src/models/package.model.js', () => ({ findActiveById: vi.fn() }));

const cartModel = await import('../../src/models/cart.model.js');
const packageModel = await import('../../src/models/package.model.js');
const cartService = await import('../../src/services/cart.service.js');

const row = (overrides) => ({
  id: 1,
  months: 1,
  package_id: 1,
  code: 'basic',
  name: 'Basic',
  tier: 1,
  price_per_month: 29000,
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe('cartService.buildCart', () => {
  it('tính thành tiền từng gói và tổng tiền từ giá trong DB', () => {
    const cart = cartService.buildCart([
      row(),
      row({ id: 2, months: 6, package_id: 2, code: 'gold', price_per_month: 59000 }),
    ]);
    expect(cart.items.map((i) => i.subtotal)).toEqual([29000, 354000]);
    expect(cart.totalAmount).toBe(383000);
    expect(cart.itemCount).toBe(2);
  });

  it('giỏ trống → tổng 0', () => {
    expect(cartService.buildCart([])).toEqual({ items: [], itemCount: 0, totalAmount: 0 });
  });
});

describe('cartService.addItem', () => {
  it('gói không tồn tại / ngừng bán → 404 PACKAGE_NOT_FOUND, không ghi DB', async () => {
    packageModel.findActiveById.mockResolvedValue(null);
    await expect(cartService.addItem(1, { packageId: 99, months: 1 })).rejects.toMatchObject({
      statusCode: 404,
      code: 'PACKAGE_NOT_FOUND',
    });
    expect(cartModel.upsert).not.toHaveBeenCalled();
  });

  it('gói hợp lệ → upsert rồi trả giỏ mới', async () => {
    packageModel.findActiveById.mockResolvedValue({ id: 1 });
    cartModel.findByUser.mockResolvedValue([row({ months: 3 })]);
    const cart = await cartService.addItem(7, { packageId: 1, months: 3 });
    expect(cartModel.upsert).toHaveBeenCalledWith({ userId: 7, packageId: 1, months: 3 });
    expect(cart.totalAmount).toBe(87000);
  });
});

describe('cartService.updateItem / removeItem', () => {
  it('mục của người khác (0 dòng bị ảnh hưởng) → 404', async () => {
    cartModel.updateMonths.mockResolvedValue(0);
    await expect(cartService.updateItem(1, '5', { months: 3 })).rejects.toMatchObject({ code: 'CART_ITEM_NOT_FOUND' });
  });

  it('id không phải số nguyên dương → 404, không truy vấn DB', async () => {
    await expect(cartService.removeItem(1, 'abc')).rejects.toMatchObject({ statusCode: 404 });
    await expect(cartService.removeItem(1, '-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(cartModel.remove).not.toHaveBeenCalled();
  });
});
