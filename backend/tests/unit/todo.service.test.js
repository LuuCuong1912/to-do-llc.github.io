import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/config/db.js', () => ({ default: {}, withTransaction: (work) => work({}) }));
vi.mock('../../src/models/user.model.js', () => ({ lockById: vi.fn() }));
vi.mock('../../src/models/todo.model.js', () => ({
  listByUser: vi.fn(),
  countByUser: vi.fn(),
  findByIdForUser: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

const userModel = await import('../../src/models/user.model.js');
const todoModel = await import('../../src/models/todo.model.js');
const todoService = await import('../../src/services/todo.service.js');

const BASIC = { name: 'Basic', tier: 1, maxTasks: 20 };
const GOLD = { name: 'Gold', tier: 2, maxTasks: 100 };
const PRO = { name: 'Pro', tier: 3, maxTasks: null };
const todoRow = (overrides) => ({ id: 1, text: 'Việc', completed: 0, created_at: new Date(), ...overrides });

beforeEach(() => vi.clearAllMocks());

describe('todoService.createTodo — giới hạn theo gói', () => {
  it('đã đủ 20 việc (Basic) → 403 TASK_LIMIT_REACHED, không thêm', async () => {
    todoModel.countByUser.mockResolvedValue(20);
    await expect(todoService.createTodo(1, BASIC, { text: 'mới' })).rejects.toMatchObject({
      statusCode: 403,
      code: 'TASK_LIMIT_REACHED',
    });
    expect(todoModel.create).not.toHaveBeenCalled();
  });

  it('khóa dòng user TRƯỚC khi đếm (chống vượt giới hạn khi gửi nhiều request cùng lúc)', async () => {
    todoModel.countByUser.mockResolvedValue(0);
    todoModel.create.mockResolvedValue(5);
    todoModel.findByIdForUser.mockResolvedValue(todoRow({ id: 5 }));
    await todoService.createTodo(1, BASIC, { text: 'mới' });
    expect(userModel.lockById.mock.invocationCallOrder[0]).toBeLessThan(
      todoModel.countByUser.mock.invocationCallOrder[0],
    );
  });

  it('gói Pro (maxTasks = null) → không giới hạn', async () => {
    todoModel.countByUser.mockResolvedValue(10_000);
    todoModel.create.mockResolvedValue(1);
    todoModel.findByIdForUser.mockResolvedValue(todoRow());
    await expect(todoService.createTodo(1, PRO, { text: 'mới' })).resolves.toMatchObject({ completed: false });
  });
});

describe('todoService.updateTodo — quyền theo gói', () => {
  it('Basic sửa nội dung → 403 FEATURE_NOT_AVAILABLE', async () => {
    todoModel.findByIdForUser.mockResolvedValue(todoRow());
    await expect(todoService.updateTodo(1, BASIC, 1, { text: 'khác' })).rejects.toMatchObject({
      code: 'FEATURE_NOT_AVAILABLE',
    });
  });

  it('Basic vẫn đánh dấu hoàn thành được', async () => {
    todoModel.findByIdForUser.mockResolvedValue(todoRow());
    await todoService.updateTodo(1, BASIC, 1, { completed: true });
    expect(todoModel.update).toHaveBeenCalledWith({ id: 1, userId: 1, text: undefined, completed: true });
  });

  it('Gold sửa việc ĐÃ hoàn thành → 409 TODO_COMPLETED', async () => {
    todoModel.findByIdForUser.mockResolvedValue(todoRow({ completed: 1 }));
    await expect(todoService.updateTodo(1, GOLD, 1, { text: 'khác' })).rejects.toMatchObject({
      code: 'TODO_COMPLETED',
    });
  });

  it('Gold vừa bỏ đánh dấu vừa sửa nội dung trong cùng request → được phép', async () => {
    todoModel.findByIdForUser.mockResolvedValue(todoRow({ completed: 1 }));
    await todoService.updateTodo(1, GOLD, 1, { text: 'khác', completed: false });
    expect(todoModel.update).toHaveBeenCalled();
  });

  it('việc không tồn tại / của người khác → 404', async () => {
    todoModel.findByIdForUser.mockResolvedValue(null);
    await expect(todoService.updateTodo(1, GOLD, 99, { completed: true })).rejects.toMatchObject({ statusCode: 404 });
  });
});
