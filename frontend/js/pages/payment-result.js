import { getOrder } from '../api/order.api.js';
import { getMe } from '../api/auth.api.js';
import { initPage } from '../utils/auth-guard.js';
import { renderNavbar } from '../components/navbar.js';
import { showToast } from '../components/toast.js';
import { orderItemsList } from '../components/order-summary.js';
import { el } from '../utils/dom.js';
import { formatVND, formatDateTime } from '../utils/format.js';
import { setSubmitting } from '../utils/form.js';
import { startPayment } from '../utils/payment-flow.js';

await initPage({ access: 'required' });
const root = document.getElementById('result-root');
const params = new URLSearchParams(window.location.search);
const orderId = params.get('orderId');
const fromGateway = params.has('gateway'); // vừa quay về từ VNPay

if (params.get('gateway') === 'invalid') {
  showToast('Dữ liệu trả về từ cổng thanh toán không hợp lệ', 'error');
}

const VIEWS = {
  paid: { icon: 'fa-check', tone: 'success', title: 'Thanh toán thành công', desc: 'Gói của bạn đã được kích hoạt.' },
  failed: {
    icon: 'fa-xmark',
    tone: 'danger',
    title: 'Thanh toán không thành công',
    desc: 'Giỏ hàng của bạn vẫn được giữ nguyên, bạn có thể đặt lại.',
  },
  pending: {
    icon: 'fa-clock',
    tone: 'warning',
    title: 'Đơn hàng đang chờ thanh toán',
    desc: 'Nếu bạn đã thanh toán, hệ thống sẽ cập nhật sau ít giây.',
  },
};

const actionsFor = (order) => {
  if (order.status === 'paid') {
    return [
      el('a', { class: 'btn btn--primary', href: '/pages/app.html' }, 'Dùng Todo App ngay'),
      el('a', { class: 'btn btn--ghost', href: '/pages/orders.html' }, 'Xem đơn hàng'),
    ];
  }
  if (order.status === 'pending') {
    const payButton = el('button', { type: 'button', class: 'btn btn--primary' }, 'Thanh toán ngay');
    payButton.addEventListener('click', async () => {
      setSubmitting(payButton, true);
      try {
        await startPayment(order);
      } catch (err) {
        showToast(err.message, 'error');
        setSubmitting(payButton, false);
      }
    });
    return [payButton, el('a', { class: 'btn btn--ghost', href: '/pages/orders.html' }, 'Xem đơn hàng')];
  }
  return [
    el('a', { class: 'btn btn--primary', href: '/pages/cart.html' }, 'Về giỏ hàng'),
    el('a', { class: 'btn btn--ghost', href: '/pages/orders.html' }, 'Xem đơn hàng'),
  ];
};

const render = (order) => {
  const view = VIEWS[order.status] ?? VIEWS.failed;
  root.replaceChildren(
    el(
      'section',
      { class: 'result card', 'data-status': order.status },
      el(
        'span',
        { class: `result__icon result__icon--${view.tone}` },
        el('i', { class: `fa-solid ${view.icon}`, 'aria-hidden': 'true' }),
      ),
      el('h1', { class: 'result__title' }, view.title),
      el('p', { class: 'result__desc' }, view.desc),
      el(
        'div',
        { class: 'result__body' },
        el('p', { class: 'summary__row' }, el('span', {}, 'Mã đơn'), el('strong', {}, order.orderCode)),
        el('p', { class: 'summary__row' }, el('span', {}, 'Ngày đặt'), el('span', {}, formatDateTime(order.createdAt))),
        orderItemsList(order),
        el('p', { class: 'summary__total' }, el('span', {}, 'Tổng cộng'), el('span', {}, formatVND(order.totalAmount))),
      ),
      el('div', { class: 'result__actions' }, actionsFor(order)),
    ),
  );
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  if (!orderId) throw new Error('Thiếu mã đơn hàng');
  let order = await getOrder(orderId);

  // Vừa từ VNPay về mà đơn vẫn pending: IPN có thể tới trễ vài giây → hỏi lại tối đa 5 lần
  for (let attempt = 0; fromGateway && order.status === 'pending' && attempt < 5; attempt++) {
    render(order);
    await wait(2000);
    order = await getOrder(orderId);
  }

  render(order);
  if (order.status === 'paid') renderNavbar(await getMe()); // cập nhật huy hiệu gói trên navbar
} catch (err) {
  root.replaceChildren(
    el(
      'div',
      { class: 'empty-state card' },
      el('h1', { class: 'empty-state__title' }, 'Không tìm thấy đơn hàng'),
      el('p', { class: 'empty-state__desc' }, err.message),
      el('a', { class: 'btn btn--primary', href: '/pages/orders.html' }, 'Xem đơn hàng của tôi'),
    ),
  );
}
