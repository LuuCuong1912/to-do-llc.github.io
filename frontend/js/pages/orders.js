import { getOrders, cancelOrder } from '../api/order.api.js';
import { initPage } from '../utils/auth-guard.js';
import { showToast } from '../components/toast.js';
import { statusBadge, orderItemsList } from '../components/order-summary.js';
import { el } from '../utils/dom.js';
import { formatVND, formatDateTime, PAYMENT_METHOD_LABEL } from '../utils/format.js';
import { setSubmitting } from '../utils/form.js';
import { startPayment } from '../utils/payment-flow.js';

await initPage({ access: 'required' });
const root = document.getElementById('orders-root');

const payButton = (order) => {
  const button = el('button', { type: 'button', class: 'btn btn--primary' }, 'Thanh toán');
  button.addEventListener('click', async () => {
    setSubmitting(button, true);
    try {
      await startPayment(order);
    } catch (err) {
      showToast(err.message, 'error');
      setSubmitting(button, false);
    }
  });
  return button;
};

const cancelButton = (order) => {
  const button = el('button', { type: 'button', class: 'btn btn--ghost' }, 'Hủy đơn');
  button.addEventListener('click', async () => {
    if (!window.confirm(`Hủy đơn ${order.orderCode}?`)) return;
    setSubmitting(button, true, 'Đang hủy...');
    try {
      await cancelOrder(order.id);
      showToast(`Đã hủy đơn ${order.orderCode}`, 'info');
      await renderOrders();
    } catch (err) {
      showToast(err.message, 'error'); // vd: đơn đang được thanh toán qua VNPay
      setSubmitting(button, false);
    }
  });
  return button;
};

const orderCard = (order) =>
  el(
    'li',
    { class: 'order-card card', 'data-order': order.orderCode },
    el(
      'div',
      { class: 'order-card__head' },
      el(
        'div',
        {},
        el('p', { class: 'order-card__code' }, order.orderCode),
        el('p', { class: 'order-card__date' }, `Đặt lúc ${formatDateTime(order.createdAt)}`),
        order.expiresAt &&
          el(
            'p',
            { class: 'order-card__date' },
            `Thanh toán trước ${formatDateTime(order.expiresAt)}, quá hạn đơn tự hủy`,
          ),
      ),
      statusBadge(order.status),
    ),
    orderItemsList(order),
    el(
      'div',
      { class: 'order-card__foot' },
      el('span', { class: 'order-card__date' }, `Thanh toán: ${PAYMENT_METHOD_LABEL[order.paymentMethod] ?? '—'}`),
      el(
        'div',
        { class: 'line-item__controls' },
        el('span', { class: 'order-total' }, formatVND(order.totalAmount)),
        order.status === 'pending' && cancelButton(order),
        order.status === 'pending' && payButton(order),
      ),
    ),
  );

async function renderOrders() {
  try {
    const orders = await getOrders();
    root.replaceChildren(
      orders.length === 0
        ? el(
            'div',
            { class: 'empty-state card' },
            el('img', { src: '/assets/images/empty3.svg', alt: '' }),
            el('h2', { class: 'empty-state__title' }, 'Bạn chưa có đơn hàng nào'),
            el('a', { class: 'btn btn--primary', href: '/#pricing' }, 'Xem các gói'),
          )
        : el('ul', { class: 'order-list' }, orders.map(orderCard)),
    );
  } catch (err) {
    root.replaceChildren(el('p', { class: 'form-alert' }, err.message));
  }
}

await renderOrders();
