import { getPackages } from '../api/package.api.js';
import { addToCart } from '../api/cart.api.js';
import { initPage, redirectToLogin } from '../utils/auth-guard.js';
import { createPackageCard } from '../components/package-card.js';
import { showToast } from '../components/toast.js';
import { updateCartBadge } from '../components/navbar.js';
import { el } from '../utils/dom.js';

const session = await initPage({ access: 'public' });
const grid = document.getElementById('pricing-grid');

// Đã đăng nhập thì không mời "Đăng ký" nữa — chỉ giữ nút "Xem bảng giá"
if (session) {
  document.getElementById('hero-cta').remove();
  document.getElementById('hero-pricing').classList.replace('btn--ghost', 'btn--primary');
}

// Đã có gói thì không cần dùng thử — cùng đường dẫn, mở bản đầy đủ
if (session?.currentPlan) {
  document.getElementById('hero-trial').lastChild.textContent = ' Mở Todo App ';
}

const handleAddToCart = async (pkg, months) => {
  if (!session) {
    // Đăng nhập xong quay lại đúng bảng giá
    window.location.hash = 'pricing';
    return redirectToLogin();
  }
  try {
    const cart = await addToCart({ packageId: pkg.id, months });
    updateCartBadge(cart.itemCount);
    showToast(`Đã thêm gói ${pkg.name} (${months} tháng) vào giỏ hàng`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const renderError = (message) => {
  grid.replaceChildren(
    el(
      'div',
      { class: 'empty-state card pricing-status' },
      el('p', { class: 'empty-state__title' }, 'Không tải được bảng giá'),
      el('p', { class: 'empty-state__desc' }, message),
      el('button', { type: 'button', class: 'btn btn--primary', onClick: loadPricing }, 'Thử lại'),
    ),
  );
};

async function loadPricing() {
  try {
    const packages = await getPackages();
    grid.replaceChildren(
      ...packages.map((pkg) =>
        createPackageCard(pkg, {
          isCurrent: session?.currentPlan?.code === pkg.code,
          onAddToCart: handleAddToCart,
        }),
      ),
    );
  } catch (err) {
    renderError(err.message);
  }
}

await loadPricing();

// Trang được tạo bằng JS → trình duyệt chưa cuộn tới #pricing lúc tải, cuộn lại sau khi vẽ xong
if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
