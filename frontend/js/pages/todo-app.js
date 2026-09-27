import * as todoApi from '../api/todo.api.js';
import * as trialStore from '../api/trial-todo.store.js';
import { initPage } from '../utils/auth-guard.js';
import { showToast } from '../components/toast.js';
import { createTodoItem } from '../components/todo-item.js';
import { el, icon } from '../utils/dom.js';
import { formatDate } from '../utils/format.js';
import { celebrate } from '../utils/confetti.js';

const CONFETTI_MIN_TIER = 2; // pháo giấy có từ gói Gold

// Ai cũng mở được trang này: đã mua gói → bản đầy đủ (lưu MySQL), chưa → bản dùng thử (lưu trên trình duyệt).
// 2 nguồn dữ liệu có CÙNG các hàm getTodos / createTodo / updateTodo / deleteTodo → phần giao diện bên dưới dùng chung.
const session = await initPage({ access: 'public' });
let store = session?.currentPlan ? todoApi : trialStore;

const root = document.getElementById('app-root');
let state = { todos: [], plan: null, limits: { maxTasks: null, canEdit: false } };

// ---------- Các phần tử cố định của trang (tạo 1 lần) ----------
const list = el('ul', { class: 'todo-list', 'aria-label': 'Danh sách công việc' });
const emptyImage = el('img', { class: 'todo-empty', src: '/assets/images/empty3.svg', alt: 'Chưa có công việc nào' });
const progress = el('div', { class: 'todo-stats__progress' });
const numbers = el('p', { class: 'todo-stats__numbers', 'aria-live': 'polite' }, '0 / 0');
const usage = el('span');
const limitNotice = el('p', { class: 'todo-limit', hidden: true });
const input = el('input', {
  class: 'input',
  name: 'text',
  maxlength: 200,
  placeholder: 'Thêm nhiệm vụ mới',
  'aria-label': 'Nội dung công việc',
  autocomplete: 'off',
});
const submit = el(
  'button',
  { type: 'submit', class: 'btn btn--primary todo-form__submit', 'aria-label': 'Thêm công việc' },
  icon('plus'),
);
const form = el('form', { class: 'todo-form' }, input, submit);

const isAtLimit = () => state.limits.maxTasks !== null && state.todos.length >= state.limits.maxTasks;

// ---------- Vẽ lại phần thay đổi ----------
const render = () => {
  const total = state.todos.length;
  const completed = state.todos.filter((t) => t.completed).length;

  progress.style.width = total ? `${(completed / total) * 100}%` : '0%';
  numbers.textContent = `${completed} / ${total}`;
  usage.textContent =
    state.limits.maxTasks === null ? `${total} việc · không giới hạn` : `${total} / ${state.limits.maxTasks} việc`;

  const atLimit = isAtLimit();
  input.disabled = atLimit;
  submit.disabled = atLimit;
  limitNotice.hidden = !atLimit;

  emptyImage.hidden = total > 0;
  list.replaceChildren(
    ...state.todos.map((todo) =>
      createTodoItem(todo, {
        canEdit: state.limits.canEdit,
        onToggle: handleToggle,
        onSave: handleSave,
        onDelete: handleDelete,
      }),
    ),
  );
};

const replaceTodo = (updated) => {
  state.todos = state.todos.map((t) => (t.id === updated.id ? updated : t));
};

// ---------- Xử lý thao tác ----------
// CẬP NHẬT LẠC QUAN: đổi giao diện NGAY rồi mới gửi request → người dùng không phải chờ mạng.
// Request lỗi → trả lại ĐÚNG việc đó về như cũ (không khôi phục cả danh sách, để không làm mất
// thay đổi của các thao tác khác đang chạy song song) và báo lỗi.
const rollback = (err, undo) => {
  undo();
  render();
  showToast(err.message, 'error');
};

async function handleToggle(todo, completed) {
  replaceTodo({ ...todo, completed });
  render();
  const allDone = state.todos.length > 0 && state.todos.every((t) => t.completed);
  if (completed && allDone && state.plan.tier >= CONFETTI_MIN_TIER) celebrate();

  try {
    await store.updateTodo(todo.id, { completed });
  } catch (err) {
    rollback(err, () => replaceTodo(todo));
  }
}

async function handleSave(todo, text) {
  replaceTodo({ ...todo, text });
  render();
  try {
    await store.updateTodo(todo.id, { text });
  } catch (err) {
    rollback(err, () => replaceTodo(todo));
  }
}

async function handleDelete(todo) {
  const index = state.todos.findIndex((t) => t.id === todo.id);
  state.todos = state.todos.filter((t) => t.id !== todo.id);
  render();
  try {
    await store.deleteTodo(todo.id);
  } catch (err) {
    rollback(err, () => {
      if (!state.todos.some((t) => t.id === todo.id)) state.todos.splice(index, 0, todo);
    });
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return input.focus();

  submit.disabled = true;
  try {
    state.todos = [...state.todos, await store.createTodo(text)];
    input.value = '';
  } catch (err) {
    showToast(err.message, 'error');
  }
  render();
  if (!input.disabled) input.focus();
});

// ---------- Khung trang ----------
const isTrial = () => store === trialStore;

// Dải thông báo bản dùng thử: khách → mời đăng ký, đã đăng nhập → mời mua gói
const trialBanner = () =>
  el(
    'p',
    { class: 'notice', role: 'status' },
    icon('flask'),
    el(
      'span',
      {},
      el('strong', {}, 'Bạn đang dùng thử miễn phí. '),
      `Tối đa ${state.plan.maxTasks} công việc, dữ liệu chỉ lưu trên trình duyệt này. `,
      session
        ? el('a', { href: '/#pricing' }, 'Mua gói')
        : el('a', { href: '/pages/register.html?redirect=%2F%23pricing' }, 'Đăng ký'),
      ' để lưu trên đám mây và mở khóa thêm tính năng.',
    ),
  );

const renderApp = () => {
  const { plan } = state;
  limitNotice.replaceChildren(
    isTrial()
      ? `Bản dùng thử cho phép tối đa ${plan.maxTasks} công việc. `
      : `Bạn đã dùng hết ${plan.maxTasks} công việc của gói ${plan.name}. `,
    el('a', { href: '/#pricing' }, isTrial() ? 'Mua gói' : 'Nâng cấp gói'),
    ' để thêm nhiều hơn.',
  );

  root.replaceChildren(
    el(
      'section',
      { class: 'todo-app card', 'aria-labelledby': 'todo-title' },
      isTrial() && trialBanner(),
      el(
        'div',
        { class: 'todo-app__head' },
        el('h1', { class: 'todo-app__title', id: 'todo-title' }, 'Công việc của tôi'),
        el(
          'p',
          { class: 'todo-app__plan' },
          el('span', { class: `badge badge--${plan.code}` }, plan.name),
          plan.endAt ? `hết hạn ${formatDate(plan.endAt)} ·` : 'lưu trên trình duyệt ·',
          usage,
        ),
      ),
      el(
        'div',
        { class: 'todo-stats' },
        el(
          'div',
          { class: 'todo-stats__details' },
          el('h2', { class: 'feature__title' }, 'Cố lên nào!'),
          el('div', { class: 'todo-stats__bar' }, progress),
        ),
        numbers,
      ),
      form,
      limitNotice,
      list,
      emptyImage,
    ),
  );
  render();
};

try {
  try {
    state = await store.getTodos();
  } catch (err) {
    // Gói vừa hết hạn sau lúc tải navbar → chuyển sang bản dùng thử thay vì báo lỗi
    if (err.code !== 'SUBSCRIPTION_REQUIRED') throw err;
    store = trialStore;
    state = await store.getTodos();
  }
  renderApp();
} catch (err) {
  root.replaceChildren(el('p', { class: 'form-alert' }, err.message));
}
