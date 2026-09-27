import Joi from 'joi';
import { PAYMENT_METHOD_CODES } from '../services/payment/methods.js';

export const createOrderSchema = Joi.object({
  paymentMethod: Joi.string()
    .valid(...PAYMENT_METHOD_CODES)
    .required()
    .messages({
      'any.required': 'Vui lòng chọn phương thức thanh toán',
      'string.base': 'Phương thức thanh toán không hợp lệ',
      'any.only': 'Phương thức thanh toán không hợp lệ',
    }),
});
