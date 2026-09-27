// Địa chỉ Backend.
// - Dev (Live Server cổng 5500): Backend ở cổng 3000, CÙNG hostname với trang (127.0.0.1 hoặc localhost)
//   → trình duyệt coi 2 cổng của cùng hostname là "cùng site" → cookie đăng nhập (SameSite=Lax) được gửi kèm.
// - Deploy (Express phục vụ luôn frontend, SERVE_FRONTEND=true): API nằm ngay trên cùng tên miền.
const isLiveServer = window.location.port === '5500';

export const API_BASE_URL = isLiveServer
  ? `${window.location.protocol}//${window.location.hostname}:3000/api`
  : `${window.location.origin}/api`;
