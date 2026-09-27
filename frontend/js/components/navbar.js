import { el, icon } from '../utils/dom.js';
import { logout } from '../api/auth.api.js';
import { showToast, setFlashToast } from './toast.js';

const handleLogout = async () => {
  try {
    await logout();
    setFlashToast('Đã đăng xuất', 'info');
    window.location.href = '/';
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// Đánh dấu link của trang đang mở (aria-current) để người dùng biết mình ở đâu
const navLink = (href, label, iconName) =>
  el(
    'li',
    {},
    el(
      'a',
      { class: 'navbar__link', href, 'aria-current': window.location.pathname === href ? 'page' : false },
      iconName && icon(iconName),
      label,
    ),
  );

const guestItems = () => [
  navLink('/pages/app.html', 'Dùng thử'),
  navLink('/#pricing', 'Bảng giá'),
  navLink('/pages/login.html', 'Đăng nhập'),
  el('li', {}, el('a', { class: 'btn btn--primary', href: '/pages/register.html' }, 'Đăng ký')),
];

const cartLink = (count) =>
  el(
    'li',
    {},
    el(
      'a',
      {
        class: 'navbar__link navbar__cart',
        href: '/pages/cart.html',
        'aria-current': window.location.pathname === '/pages/cart.html' ? 'page' : false,
      },
      icon('cart'),
      'Giỏ hàng',
      el('span', { class: 'navbar__badge', id: 'cart-badge', hidden: count === 0 }, String(count)),
    ),
  );

// fullName là dữ liệu người dùng nhập → el() đưa vào dạng text, an toàn
const userItems = ({ user, currentPlan, cartCount = 0 }) => [
  navLink('/pages/app.html', 'Todo App', 'list-checks'),
  navLink('/pages/orders.html', 'Đơn hàng', 'receipt'),
  cartLink(cartCount),
  el(
    'li',
    { class: 'navbar__user', title: user.fullName },
    el('span', { class: 'navbar__greeting' }, user.fullName),
    currentPlan
      ? el('span', { class: `badge badge--plan badge--${currentPlan.code}` }, currentPlan.name)
      : el('span', { class: 'badge badge--muted' }, 'Chưa có gói'),
  ),
  el(
    'li',
    {},
    el('button', { type: 'button', class: 'btn btn--ghost', onClick: handleLogout }, icon('log-out'), 'Đăng xuất'),
  ),
];

// Cập nhật số trên icon giỏ hàng sau khi thêm/xóa, không cần tải lại trang
export const updateCartBadge = (count) => {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  badge.textContent = String(count);
  badge.hidden = count === 0;
};

// Vẽ navbar vào <header id="navbar">. session = null nghĩa là chưa đăng nhập.
export const renderNavbar = (session) => {
  const header = document.getElementById('navbar');
  if (!header) return;

  const menu = el('ul', { class: 'navbar__menu', id: 'navbar-menu' }, session ? userItems(session) : guestItems());

  const toggle = el(
    'button',
    {
      type: 'button',
      class: 'navbar__toggle',
      'aria-controls': 'navbar-menu',
      'aria-expanded': 'false',
      'aria-label': 'Mở menu',
      onClick: () => {
        const isOpen = menu.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Đóng menu' : 'Mở menu');
      },
    },
    icon('menu'),
  );

  header.replaceChildren(
    el(
      'nav',
      { class: 'navbar__inner container', 'aria-label': 'Điều hướng chính' },
      el('a', { class: 'navbar__brand', href: '/' }, icon('list-checks'), 'TodoPro'),
      toggle,
      menu,
    ),
  );
};
