import * as todoService from '../services/todo.service.js';

export const list = async (req, res) => {
  const { todos, limits } = await todoService.listTodos(req.user.id, req.plan);
  res.json({ success: true, data: { todos, plan: req.plan, limits } });
};

export const create = async (req, res) => {
  const todo = await todoService.createTodo(req.user.id, req.plan, req.body);
  res.status(201).json({ success: true, data: { todo } });
};

export const update = async (req, res) => {
  const todo = await todoService.updateTodo(req.user.id, req.plan, req.params.id, req.body);
  res.json({ success: true, data: { todo } });
};

export const remove = async (req, res) => {
  await todoService.deleteTodo(req.user.id, req.params.id);
  res.json({ success: true, data: null });
};
