import { el } from '../utils/dom.js';

// 1 dòng công việc. Nội dung hiển thị bằng textContent (qua el()) → không bị XSS như app cũ (innerHTML).
// handlers: { onToggle(todo, completed), onSave(todo, text), onDelete(todo) } — đều là hàm async
export const createTodoItem = (todo, { canEdit, onToggle, onSave, onDelete }) => {
  const text = el('span', { class: 'todo-item__text' }, todo.text);

  const checkbox = el('input', {
    type: 'checkbox',
    class: 'todo-item__check',
    checked: todo.completed,
    'aria-label': `Đánh dấu hoàn thành: ${todo.text}`,
  });
  checkbox.addEventListener('change', async () => {
    checkbox.disabled = true;
    await onToggle(todo, checkbox.checked);
  });

  // Giữ quy tắc app cũ: việc đã hoàn thành thì không sửa được
  const editTitle = !canEdit
    ? 'Chỉnh sửa có từ gói Gold'
    : todo.completed
      ? 'Việc đã hoàn thành không thể sửa'
      : 'Sửa công việc';
  const editButton = el(
    'button',
    {
      type: 'button',
      class: 'todo-item__btn todo-item__btn--edit',
      disabled: !canEdit || todo.completed,
      title: editTitle,
      'aria-label': `${editTitle}: ${todo.text}`,
    },
    el('i', { class: 'fa-solid fa-pen', 'aria-hidden': 'true' }),
  );

  const deleteButton = el(
    'button',
    { type: 'button', class: 'todo-item__btn todo-item__btn--delete', 'aria-label': `Xóa: ${todo.text}` },
    el('i', { class: 'fa-solid fa-trash', 'aria-hidden': 'true' }),
  );
  deleteButton.addEventListener('click', async () => {
    deleteButton.disabled = true;
    await onDelete(todo);
  });

  const item = el(
    'li',
    { class: `todo-item ${todo.completed ? 'is-completed' : ''}`, 'data-id': todo.id },
    checkbox,
    text,
    el('div', { class: 'todo-item__actions' }, editButton, deleteButton),
  );

  // Sửa tại chỗ: Enter / rời ô → lưu, Esc → hủy
  editButton.addEventListener('click', () => {
    const input = el('input', {
      class: 'todo-item__edit',
      value: todo.text,
      maxlength: 200,
      'aria-label': 'Nội dung mới',
    });
    let done = false;
    const finish = async (save) => {
      if (done) return;
      done = true;
      const value = input.value.trim();
      if (save && value && value !== todo.text) await onSave(todo, value);
      else input.replaceWith(text);
    };
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') finish(true);
      if (event.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
    text.replaceWith(input);
    input.focus();
    input.select();
  });

  return item;
};
