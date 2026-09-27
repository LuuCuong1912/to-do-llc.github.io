import { getCart, updateCartItem, removeCartItem } from '../api/cart.api.js';
import { initPage } from '../utils/auth-guard.js';
import { updateCartBadge } from '../components/navbar.js';
import { showToast } from '../components/toast.js';
import { el, icon } from '../utils/dom.js';
import { formatVND } from '../utils/format.js';

await initPage({ access: 'required' });
const root = document.getElementById('cart-root');

const emptyState = () =>
  el(
    'div',
    { class: 'empty-state card' },
    el('img', { src: '/assets/images/empty3.svg', alt: '' }),
    el('h2', { class: 'empty-state__title' }, 'Giỏ hàng đang trống'),
    el('p', { class: 'empty-state__desc' }, 'Chọn một gói phù hợp để bắt đầu dùng TodoPro.'),
    el('a', { class: 'btn btn--primary', href: '/#pricing' }, 'Xem các gói'),
  );

// Mọi thao tác đều nhận về giỏ hàng MỚI từ Backend rồi vẽ lại → giá luôn đúng theo Backend
const runAction = async (action, control) => {
  control.disabled = true;
  try {
    render(await action());
  } catch (err) {
    showToast(err.message, 'error');
    render(await getCart()); // đưa giao diện về đúng dữ liệu thật
  }
};

const cartItemRow = (item, monthOptions) => {
  const monthSelect = el(
    'select',
    { class: 'select', 'aria-label': `Số tháng gói ${item.package.name}` },
    monthOptions.map((m) => el('option', { value: m, selected: m === item.months }, `${m} tháng`)),
  );
  monthSelect.addEventListener('change', () =>
    runAction(() => updateCartItem(item.id, { months: Number(monthSelect.value) }), monthSelect),
  );

  const removeButton = el(
    'button',
    { type: 'button', class: 'icon-btn', 'aria-label': `Xóa gói ${item.package.name} khỏi giỏ` },
    icon('trash'),
  );
  removeButton.addEventListener('click', () => runAction(() => removeCartItem(item.id), removeButton));

  return el(
    'li',
    { class: 'line-item card' },
    el(
      'div',
      {},
      el(
        'p',
        { class: 'line-item__name' },
        `Gói ${item.package.name}`,
        el('span', { class: `badge badge--${item.package.code}` }, item.package.name),
      ),
      el('p', { class: 'line-item__meta' }, `${formatVND(item.unitPrice)} / tháng`),
    ),
    el('div', { class: 'line-item__controls' }, monthSelect, removeButton),
    el('p', { class: 'line-item__price' }, formatVND(item.subtotal)),
  );
};

const summary = (cart) =>
  el(
    'aside',
    { class: 'summary card', 'aria-label': 'Tóm tắt giỏ hàng' },
    el('h2', { class: 'feature__title' }, 'Tóm tắt'),
    el('p', { class: 'summary__row' }, el('span', {}, 'Số gói'), el('span', {}, String(cart.itemCount))),
    el('p', { class: 'summary__total' }, el('span', {}, 'Tổng cộng'), el('span', {}, formatVND(cart.totalAmount))),
    el('a', { class: 'btn btn--primary btn--block', href: '/pages/checkout.html' }, 'Tiến hành thanh toán'),
    el('p', { class: 'summary__note' }, 'Giá đã bao gồm VAT. Gói được kích hoạt ngay sau khi thanh toán thành công.'),
  );

function render(cart) {
  updateCartBadge(cart.itemCount);
  if (cart.itemCount === 0) return root.replaceChildren(emptyState());

  root.replaceChildren(
    el(
      'div',
      { class: 'shop-layout' },
      el(
        'ul',
        { class: 'line-items' },
        cart.items.map((item) => cartItemRow(item, cart.monthOptions)),
      ),
      summary(cart),
    ),
  );
}

try {
  render(await getCart());
} catch (err) {
  root.replaceChildren(el('p', { class: 'form-alert' }, err.message));
}
