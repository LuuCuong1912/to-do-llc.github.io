import { request } from './http.js';

// → { todos, plan, limits: { maxTasks, canEdit } }
export const getTodos = () => request('/todos');

export const createTodo = async (text) => (await request('/todos', { method: 'POST', body: { text } })).todo;

export const updateTodo = async (id, changes) =>
  (await request(`/todos/${id}`, { method: 'PATCH', body: changes })).todo;

export const deleteTodo = (id) => request(`/todos/${id}`, { method: 'DELETE' });
