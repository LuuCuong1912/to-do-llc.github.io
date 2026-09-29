// Hiệu ứng pháo giấy (thư viện @hiseb/confetti như app cũ), tự host trong assets/vendor/:
// không phụ thuộc CDN bên ngoài (CDN chậm/lỗi → mất hiệu ứng, test e2e chập chờn) và CSP chỉ cần 'self'.
// Chỉ tải thư viện khi thật sự cần → trang mở nhanh hơn, gói Basic không tải thừa.
const CONFETTI_SRC = '/assets/vendor/confetti.min.js';
let loading = null;

const loadLibrary = () => {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CONFETTI_SRC;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
  return loading;
};

export const celebrate = async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    await loadLibrary();
  } catch {
    return; // không tải được thì bỏ qua hiệu ứng, không ảnh hưởng chức năng
  }

  // App cũ dùng tọa độ cố định (x: 1500) → lệch trên màn hình nhỏ. Giờ tính theo kích thước cửa sổ.
  const { innerWidth: w, innerHeight: h } = window;
  for (const x of [0, w / 2, w]) {
    window.confetti({ position: { x, y: x === w / 2 ? h / 3 : 0 }, count: 100, size: 1, velocity: 200, fade: false });
  }
};
