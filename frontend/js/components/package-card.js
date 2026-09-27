import { el, icon } from '../utils/dom.js';
import { formatVND } from '../utils/format.js';
import { setSubmitting } from '../utils/form.js';

const POPULAR_CODE = 'gold';

// Thẻ 1 gói trên bảng giá. onAddToCart(pkg, months) do trang gọi truyền vào.
// monthOptions: danh sách số tháng lấy từ API (GET /packages)
export const createPackageCard = (pkg, { isCurrent = false, monthOptions, onAddToCart }) => {
  let months = monthOptions[0];

  const total = el('p', { class: 'package-card__total', 'aria-live': 'polite' });
  const renderTotal = () => {
    total.textContent =
      months === 1 ? 'Thanh toán theo tháng' : `Tổng ${formatVND(pkg.pricePerMonth * months)} cho ${months} tháng`;
  };

  // Radio thật (ẩn) + nhãn dạng nút → dùng được bàn phím và trình đọc màn hình
  const monthPicker = el(
    'fieldset',
    { class: 'segmented' },
    el('legend', { class: 'sr-only' }, `Số tháng cho gói ${pkg.name}`),
    monthOptions.map((value) =>
      el(
        'label',
        { class: 'segmented__option' },
        el('input', {
          type: 'radio',
          name: `months-${pkg.code}`,
          value,
          checked: value === months,
          onChange: () => {
            months = value;
            renderTotal();
          },
        }),
        el('span', {}, `${value} tháng`),
      ),
    ),
  );

  const isPopular = pkg.code === POPULAR_CODE;
  const addButton = el(
    'button',
    {
      type: 'button',
      class: `btn btn--block ${isPopular ? 'btn--primary' : 'btn--ghost'}`,
      'data-package': pkg.code,
      onClick: async () => {
        setSubmitting(addButton, true, 'Đang thêm...');
        try {
          await onAddToCart(pkg, months);
        } finally {
          setSubmitting(addButton, false);
        }
      },
    },
    'Thêm vào giỏ',
  );

  renderTotal();

  return el(
    'article',
    { class: `package-card card ${isPopular ? 'package-card--featured' : ''}`, 'aria-label': `Gói ${pkg.name}` },
    isPopular && el('span', { class: 'package-card__ribbon' }, 'Phổ biến nhất'),
    el(
      'div',
      { class: 'package-card__head' },
      el('h3', { class: 'package-card__name' }, pkg.name),
      isCurrent && el('span', { class: 'badge badge--success' }, 'Gói hiện tại'),
    ),
    el('p', { class: 'package-card__desc' }, pkg.description),
    el(
      'p',
      { class: 'package-card__price' },
      el('strong', {}, formatVND(pkg.pricePerMonth)),
      el('span', {}, ' / tháng'),
    ),
    monthPicker,
    total,
    addButton,
    el(
      'ul',
      { class: 'package-card__features' },
      pkg.features.map((feature) => el('li', {}, icon('check'), el('span', {}, feature))),
    ),
  );
};
