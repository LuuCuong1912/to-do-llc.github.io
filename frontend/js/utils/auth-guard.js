import { getMe } from '../api/auth.api.js';
import { renderNavbar } from '../components/navbar.js';
import { showToast, showFlashToast } from '../components/toast.js';

const LOGIN_PAGE = '/pages/login.html';

// Hỏi Backend "tôi là ai?" — chưa đăng nhập (401) thì trả về null
const getSession = async () => {
  try {
    return await getMe();
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
  }
};

// Chỉ cho chuyển hướng tới đường dẫn TRONG trang web ("/..."), không cho "//trang-la.com" hay "https://..."
// → chống lỗ hổng Open Redirect (kẻ xấu gửi link login?redirect=https://trang-gia-mao.com)
export const getRedirectTarget = () => {
  const target = new URLSearchParams(window.location.search).get('redirect');
  const isSafe = target && target.startsWith('/') && !target.startsWith('//') && !target.includes('\\');
  return isSafe ? target : '/';
};

export const redirectToLogin = () => {
  const current = window.location.pathname + window.location.search + window.location.hash;
  window.location.href = `${LOGIN_PAGE}?redirect=${encodeURIComponent(current)}`;
};

// Gọi ĐẦU MỖI TRANG. Trả về session ({ user, currentPlan, cartCount }) hoặc null.
//   access: 'public'   — ai cũng vào được (trang chủ)
//           'required' — phải đăng nhập (giỏ hàng, đơn hàng...) → chưa thì chuyển sang trang đăng nhập
//           'guest'    — chỉ khi CHƯA đăng nhập (login, register) → đã đăng nhập thì chuyển đi
export const initPage = async ({ access = 'public' } = {}) => {
  let session = null;
  try {
    session = await getSession();
  } catch (err) {
    showToast(err.message, 'error'); // Backend chưa chạy / mất mạng
  }

  if (access === 'required' && !session) {
    redirectToLogin();
    return null;
  }
  if (access === 'guest' && session) {
    window.location.replace(getRedirectTarget());
    return null;
  }

  renderNavbar(session);
  showFlashToast();
  return session;
};
