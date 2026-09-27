import { HttpError } from './http.js';

// Bản DÙNG THỬ của Todo App: CÙNG các hàm với todo.api.js (getTodos, createTodo, updateTodo, deleteTodo)
// nhưng lưu vào localStorage của trình duyệt thay vì gọi Backend → không cần đăng ký / mua gói.
// Quy tắc giống gói Basic (không sửa nội dung, việc đã xong không sửa được), tối đa 5 việc.

const STORAGE_KEY = 'todopro-trial-todos';
const MAX_TASKS = 5;

export const TRIAL_PLAN = { code: 'trial', name: 'Dùng thử', tier: 0, maxTasks: MAX_TASKS, endAt: null };
const LIMITS = { maxTasks: MAX_TASKS, canEdit: false };

// Trình duyệt chặn localStorage (chế độ riêng tư...) → vẫn dùng được trong phiên hiện tại
let memoryTodos = [];

const isValidTodo = (t) =>
  t && Number.isInteger(t.id) && typeof t.text === 'string' && typeof t.completed === 'boolean';

const read = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    // Dữ liệu trong localStorage có thể bị sửa tay → chỉ nhận đúng định dạng, tối đa MAX_TASKS việc
    return Array.isArray(parsed) ? parsed.filter(isValidTodo).slice(0, MAX_TASKS) : [];
  } catch {
    return memoryTodos;
  }
};

const write = (todos) => {
  memoryTodos = todos;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // bỏ qua — đã giữ trong bộ nhớ
  }
};

const findTodo = (todos, id) => {
  const todo = todos.find((t) => t.id === id);
  if (!todo) throw new HttpError(404, 'TODO_NOT_FOUND', 'Không tìm thấy công việc');
  return todo;
};

export const getTodos = async () => ({ todos: read(), plan: TRIAL_PLAN, limits: LIMITS });

export const createTodo = async (text) => {
  const todos = read();
  if (todos.length >= MAX_TASKS) {
    throw new HttpError(
      403,
      'TASK_LIMIT_REACHED',
      `Bản dùng thử cho phép tối đa ${MAX_TASKS} công việc. Mua gói để thêm nhiều hơn.`,
    );
  }
  const todo = {
    id: todos.reduce((max, t) => Math.max(max, t.id), 0) + 1,
    text: text.trim().slice(0, 200),
    completed: false,
    createdAt: new Date().toISOString(),
  };
  write([...todos, todo]);
  return todo;
};

export const updateTodo = async (id, { text, completed }) => {
  const todos = read();
  const todo = findTodo(todos, id);

  if (text !== undefined && text !== todo.text) {
    throw new HttpError(403, 'FEATURE_NOT_AVAILABLE', 'Chỉnh sửa công việc có từ gói Gold trở lên');
  }

  const updated = { ...todo, completed: completed ?? todo.completed };
  write(todos.map((t) => (t.id === id ? updated : t)));
  return updated;
};

export const deleteTodo = async (id) => {
  const todos = read();
  findTodo(todos, id);
  write(todos.filter((t) => t.id !== id));
};
