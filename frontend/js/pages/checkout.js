import { getCart } from '../api/cart.api.js';
import { createOrder } from '../api/order.api.js';
import { getPaymentMethods } from '../api/payment.api.js';
import { initPage } from '../utils/auth-guard.js';
import { el, icon } from '../utils/dom.js';
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

// Chép vào clipboard. API mới (navigator.clipboard) có thể bị trình duyệt chặn (trang mất focus, quyền riêng tư...)
// → dự phòng bằng cách cũ: chọn chữ trong 1 ô ẩn rồi execCommand('copy').
const copyText = async (value) => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const box = el('textarea', { readonly: true });
    box.style.position = 'fixed'; // gán qua JS: CSP của trang chặn thuộc tính style="..." viết inline
    box.style.opacity = '0';
    box.value = value;
    document.body.append(box);
    box.select();
    const copied = document.execCommand('copy');
    box.remove();
    return copied;
  }
};

// Nút sao chép (số thẻ, chủ thẻ) cho người xem demo khỏi gõ tay
const copyButton = (value, label) => {
  const button = el(
    'button',
    { type: 'button', class: 'test-card__copy', 'aria-label': `Sao chép ${label}` },
    'Sao chép',
  );
  button.addEventListener('click', async () => {
    button.textContent = (await copyText(value)) ? 'Đã chép' : 'Hãy chép tay';
    setTimeout(() => (button.textContent = 'Sao chép'), 1500);
  });
  return button;
};

// Ghi chú khi chọn VNPay ở môi trường thử nghiệm: người xem (vd nhà tuyển dụng) biết không bị trừ tiền thật
// và có sẵn thẻ test để nhập trên trang VNPay. Dữ liệu thẻ do Backend gửi (chỉ khi đang dùng sandbox).
const vnpaySandboxNotice = (card) => {
  const row = (label, value, copyable) =>
    el(
      'div',
      { class: 'test-card__row' },
      el('dt', {}, label),
      el('dd', {}, value, copyable && copyButton(value, label)),
    );
  return el(
    'div',
    { class: 'notice test-card', role: 'note', hidden: true },
    icon('flask'),
    el(
      'div',
      {},
      el(
        'p',
        {},
        el('strong', {}, 'Môi trường thử nghiệm VNPay'),
        ' — không trừ tiền thật. Trên trang VNPay chọn thẻ nội địa và nhập:',
      ),
      el(
        'dl',
        { class: 'test-card__list' },
        row('Ngân hàng', card.bank),
        row('Số thẻ', card.number, true),
        row('Chủ thẻ', card.holder, true),
        row('Ngày phát hành', card.issueDate),
        row('OTP', card.otp),
      ),
    ),
  );
};

const checkoutForm = (cart, methods) => {
  const firstEnabled = methods.find((m) => m.enabled)?.code;
  const vnpay = methods.find((m) => m.code === 'vnpay' && m.enabled && m.testCard);
  const notice = vnpay && vnpaySandboxNotice(vnpay.testCard);
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
    notice,
    el('p', { class: 'summary__total' }, el('span', {}, 'Tổng cộng'), el('span', {}, formatVND(cart.totalAmount))),
    alert,
    submit,
    el('p', { class: 'summary__note' }, 'Bấm thanh toán nghĩa là bạn đồng ý với điều khoản sử dụng TodoPro.'),
  );

  // Chỉ hiện ghi chú thẻ test khi đang chọn VNPay
  const syncNotice = () => {
    if (notice) notice.hidden = new FormData(form).get('paymentMethod') !== 'vnpay';
  };
  form.addEventListener('change', syncNotice);
  syncNotice();

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
