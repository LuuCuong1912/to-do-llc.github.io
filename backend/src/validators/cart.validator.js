import Joi from 'joi';
import { ALLOWED_MONTHS } from '../services/cart.service.js';

const months = Joi.number()
  .integer()
  .valid(...ALLOWED_MONTHS)
  .required()
  .messages({
    'any.required': 'Vui lòng chọn số tháng',
    'number.base': 'Số tháng không hợp lệ',
    'any.only': `Số tháng chỉ được là ${ALLOWED_MONTHS.join(', ')}`,
  });

export const addItemSchema = Joi.object({
  packageId: Joi.number().integer().positive().required().messages({
    'any.required': 'Vui lòng chọn gói',
    'number.base': 'Gói không hợp lệ',
    'number.integer': 'Gói không hợp lệ',
    'number.positive': 'Gói không hợp lệ',
  }),
  months,
});

export const updateItemSchema = Joi.object({ months });
