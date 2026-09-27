// Lỗi "có chủ đích" do service ném ra, ví dụ:
//   throw new ApiError(404, 'PACKAGE_NOT_FOUND', 'Không tìm thấy gói');
// error.middleware sẽ bắt và trả về JSON đúng statusCode.
class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export default ApiError;
