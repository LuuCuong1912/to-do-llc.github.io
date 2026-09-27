import { withTransaction } from '../config/db.js';
import ApiError from '../utils/ApiError.js';
import * as todoModel from '../models/todo.model.js';
import * as userModel from '../models/user.model.js';

// Tính năng theo gói (tier: 1 Basic, 2 Gold, 3 Pro)
export const FEATURE_MIN_TIER = { editTodo: 2 };

// Gói "không giới hạn" (max_tasks = NULL) vẫn có trần an toàn: tránh 1 tài khoản tạo vô hạn dòng
// làm phình DB và làm trang tải cả danh sách khổng lồ
export const UNLIMITED_PLAN_CAP = 1000;

const toPublicTodo = (row) => ({
  id: row.id,
  text: row.text,
  completed: Boolean(row.completed),
  createdAt: row.created_at,
});

const toTodoId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, 'TODO_NOT_FOUND', 'Không tìm thấy công việc');
  return id;
};

const findOwnTodo = async (userId, rawId) => {
  const todo = await todoModel.findByIdForUser(toTodoId(rawId), userId);
  if (!todo) throw new ApiError(404, 'TODO_NOT_FOUND', 'Không tìm thấy công việc');
  return todo;
};

export const listTodos = async (userId, plan) => {
  const rows = await todoModel.listByUser(userId);
  return {
    todos: rows.map(toPublicTodo),
    limits: { maxTasks: plan.maxTasks, canEdit: plan.tier >= FEATURE_MIN_TIER.editTodo },
  };
};

export const createTodo = async (userId, plan, { text }) =>
  withTransaction(async (conn) => {
    // 2 request thêm việc cùng lúc: nếu không khóa, cả 2 cùng đếm được 19 và cùng thêm → vượt giới hạn 20
    await userModel.lockById(userId, conn);

    const count = await todoModel.countByUser(userId, conn);
    if (plan.maxTasks !== null && count >= plan.maxTasks) {
      throw new ApiError(
        403,
        'TASK_LIMIT_REACHED',
        `Gói ${plan.name} cho phép tối đa ${plan.maxTasks} công việc. Nâng cấp gói để thêm nhiều hơn.`,
      );
    }
    if (plan.maxTasks === null && count >= UNLIMITED_PLAN_CAP) {
      throw new ApiError(
        403,
        'TASK_LIMIT_REACHED',
        `Bạn đã có ${UNLIMITED_PLAN_CAP} công việc. Hãy xóa bớt các việc đã hoàn thành để thêm việc mới.`,
      );
    }

    const id = await todoModel.create({ userId, text }, conn);
    return toPublicTodo(await todoModel.findByIdForUser(id, userId, conn));
  });

export const updateTodo = async (userId, plan, rawId, { text, completed }) => {
  const todo = await findOwnTodo(userId, rawId);

  if (text !== undefined && text !== todo.text) {
    if (plan.tier < FEATURE_MIN_TIER.editTodo) {
      throw new ApiError(403, 'FEATURE_NOT_AVAILABLE', 'Chỉnh sửa công việc có từ gói Gold trở lên');
    }
    // Giữ quy tắc của app cũ: việc đã hoàn thành thì không sửa nội dung
    const willBeCompleted = completed ?? Boolean(todo.completed);
    if (willBeCompleted) {
      throw new ApiError(409, 'TODO_COMPLETED', 'Công việc đã hoàn thành, không thể chỉnh sửa');
    }
  }

  await todoModel.update({ id: todo.id, userId, text, completed });
  return toPublicTodo(await todoModel.findByIdForUser(todo.id, userId));
};

export const deleteTodo = async (userId, rawId) => {
  const affected = await todoModel.remove({ id: toTodoId(rawId), userId });
  if (affected === 0) throw new ApiError(404, 'TODO_NOT_FOUND', 'Không tìm thấy công việc');
};
