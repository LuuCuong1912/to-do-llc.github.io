import { getCart } from '../api/cart.api.js';
import { createOrder } from '../api/order.api.js';
import { getPaymentMethods } from '../api/payment.api.js';
import { initPage } from '../utils/auth-guard.js';
import { el } from '../utils/dom.js';
import { formatVND } from '../utils/format.js';
import { setSubmitting } from '../utils/form.js';
import { startPayment, resultPageUrl } from '../utils/payment-flow.js';
import { orderItemsList } from '../components/order-summary.js';

await initPage({ access: 'required' });
const root = document.getElementById('checkout-root');

const emptyCart = () =>
  el(
    'div',
    { class: 'empty-state card' },
    el('h2', { class: 'empty-state__title' }, 'Không có gì để thanh toán'),
    el('p', { class: 'empty-state__desc' }, 'Giỏ hàng của bạn đang trống.'),
    el('a', { class: 'btn btn--primary', href: '/#pricing' }, 'Xem các gói'),
  );

// Dùng lại component danh sách của đơn hàng: chuyển dòng giỏ hàng về cùng dạng với order item
const itemsCard = (cart) =>
  el(
    'section',
    { class: 'card checkout-items', 'aria-label': 'Các gói trong đơn' },
    el('h2', { class: 'feature__title' }, 'Đơn hàng của bạn'),
    orderItemsList({
      items: cart.items.map((item) => ({
        packageName: item.package.name,
        unitPrice: item.unitPrice,
        months: item.months,
        subtotal: item.subtotal,
      })),
    }),
    el('a', { class: 'navbar__link', href: '/pages/cart.html' }, '← Sửa giỏ hàng'),
  );

const methodOption = (method, isFirstEnabled) =>
  el(
    'label',
    { class: 'pay-method' },
    el('input', {
      type: 'radio',
      name: 'paymentMethod',
      value: method.code,
      disabled: !method.enabled,
      checked: isFirstEnabled,
    }),
    el('span', {}, method.name, !method.enabled && el('span', { class: 'summary__note' }, ' — chưa được cấu hình')),
  );

const checkoutForm = (cart, methods) => {
  const firstEnabled = methods.find((m) => m.enabled)?.code;
  const alert = el('p', { class: 'form-alert', role: 'alert' });
  const submit = el(
    'button',
    { type: 'submit', class: 'btn btn--primary btn--block', disabled: !firstEnabled },
    `Thanh toán ${formatVND(cart.totalAmount)}`,
  );

  const form = el(
    'form',
    { class: 'summary card', 'aria-label': 'Thanh toán' },
    el('h2', { class: 'feature__title' }, 'Phương thức thanh toán'),
    el(
      'fieldset',
      { class: 'pay-methods' },
      el('legend', { class: 'sr-only' }, 'Chọn phương thức thanh toán'),
      methods.map((m) => methodOption(m, m.code === firstEnabled)),
    ),
    el('p', { class: 'summary__total' }, el('span', {}, 'Tổng cộng'), el('span', {}, formatVND(cart.totalAmount))),
    alert,
    submit,
    el('p', { class: 'summary__note' }, 'Bấm thanh toán nghĩa là bạn đồng ý với điều khoản sử dụng TodoPro.'),
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    alert.textContent = '';
    setSubmitting(submit, true, 'Đang xử lý...');

    let order = null;
    try {
      order = await createOrder({ paymentMethod: new FormData(form).get('paymentMethod') });
      await startPayment(order);
    } catch (err) {
      // Đã tạo được đơn nhưng thanh toán lỗi → sang trang kết quả để thử lại, không tạo đơn trùng
      if (order) return window.location.assign(resultPageUrl(order.id));
      alert.textContent = err.message;
      setSubmitting(submit, false);
    }
  });

  return form;
};

try {
  const [cart, methods] = await Promise.all([getCart(), getPaymentMethods()]);
  root.replaceChildren(
    cart.itemCount === 0
      ? emptyCart()
      : el('div', { class: 'shop-layout' }, itemsCard(cart), checkoutForm(cart, methods)),
  );
} catch (err) {
  root.replaceChildren(el('p', { class: 'form-alert' }, err.message));
}
