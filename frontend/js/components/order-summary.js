import { el } from '../utils/dom.js';
import { formatVND, ORDER_STATUS } from '../utils/format.js';

export const statusBadge = (status) => {
  const { label, tone } = ORDER_STATUS[status] ?? { label: status, tone: 'muted' };
  return el('span', { class: `badge badge--${tone}` }, label);
};

// Danh sách gói trong đơn — dùng tên + giá LÚC MUA (lưu trong order_items)
export const orderItemsList = (order) =>
  el(
    'ul',
    { class: 'order-items' },
    order.items.map((item) =>
      el(
        'li',
        {},
        el(
          'span',
          {},
          `Gói ${item.packageName} `,
          el('span', { class: 'order-items__meta' }, `× ${item.months} tháng (${formatVND(item.unitPrice)}/tháng)`),
        ),
        el('span', {}, formatVND(item.subtotal)),
      ),
    ),
  );
