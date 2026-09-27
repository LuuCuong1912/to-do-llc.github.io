import { API_BASE_URL } from '../config.js';

// Lỗi từ API, giữ nguyên cấu trúc Backend trả về: { code, message, details }
export class HttpError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// HÀM DUY NHẤT gọi Backend. Các file api/*.api.js đều đi qua đây.
//   request('/auth/login', { method: 'POST', body: { email, password } })
// Thành công → trả về `data`. Thất bại → throw HttpError.
export const request = async (path, { method = 'GET', body } = {}) => {
  const hasBody = body !== undefined;
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include', // gửi kèm cookie đăng nhập
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new HttpError(0, 'NETWORK_ERROR', 'Không kết nối được máy chủ. Hãy kiểm tra Backend đã chạy chưa.');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    const error = payload?.error ?? {};
    throw new HttpError(
      response.status,
      error.code ?? 'UNKNOWN_ERROR',
      error.message ?? 'Đã có lỗi xảy ra, vui lòng thử lại',
      error.details ?? [],
    );
  }

  return payload.data;
};
