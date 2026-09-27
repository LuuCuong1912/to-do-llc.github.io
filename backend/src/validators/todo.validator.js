import Joi from 'joi';

const text = Joi.string().trim().min(1).max(200).messages({
  'any.required': 'Vui lòng nhập nội dung công việc',
  'string.empty': 'Vui lòng nhập nội dung công việc',
  'string.max': 'Nội dung tối đa 200 ký tự',
});

export const createTodoSchema = Joi.object({ text: text.required() });

export const updateTodoSchema = Joi.object({
  text,
  completed: Joi.boolean().messages({ 'boolean.base': 'Trạng thái không hợp lệ' }),
})
  .min(1)
  .messages({ 'object.min': 'Không có gì để cập nhật' });
