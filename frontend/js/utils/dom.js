// Tạo phần tử HTML an toàn: chuỗi con luôn được thêm dưới dạng TEXT (không phải HTML)
// → dữ liệu người dùng như "<img onerror=...>" chỉ hiện ra chữ, không chạy được script (chống XSS).
//
//   el('a', { class: 'btn', href: '/' }, 'Trang chủ')
//   el('button', { type: 'button', onClick: handle }, el('i', { class: 'fa-solid fa-bars' }))
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
