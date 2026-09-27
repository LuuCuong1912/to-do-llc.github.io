// Tạo phần tử HTML an toàn: chuỗi con luôn được thêm dưới dạng TEXT (không phải HTML)
// → dữ liệu người dùng như "<img onerror=...>" chỉ hiện ra chữ, không chạy được script (chống XSS).
//
//   el('a', { class: 'btn', href: '/' }, 'Trang chủ')
//   el('button', { type: 'button', onClick: handle }, icon('menu'))
export const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value === true ? '' : value);
    }
  }

  node.append(...children.flat().filter((child) => child != null && child !== false));
  return node;
};

// Icon SVG lấy từ sprite /assets/icons.svg (tên icon = id của <symbol> trong file đó).
// Icon chỉ để trang trí → aria-hidden; nội dung cho trình đọc màn hình nằm ở chữ / aria-label của nút.
//   icon('cart')  →  <svg class="icon"><use href="/assets/icons.svg#cart"></use></svg>
const SVG_NS = 'http://www.w3.org/2000/svg';
export const ICON_SPRITE = '/assets/icons.svg';

export const icon = (name) => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `${ICON_SPRITE}#${name}`);
  svg.append(use);
  return svg;
};

// Đổi icon đang hiển thị (vd: con mắt hiện/ẩn mật khẩu)
export const setIcon = (svg, name) => svg.querySelector('use')?.setAttribute('href', `${ICON_SPRITE}#${name}`);
