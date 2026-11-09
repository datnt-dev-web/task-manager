/**
 * Lỗi nghiệp vụ có mã HTTP và thông điệp tiếng Việt hiển thị được cho người dùng.
 */
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Dữ liệu không hợp lệ', details) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Bạn cần đăng nhập để tiếp tục') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Bạn không có quyền thực hiện thao tác này') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Không tìm thấy dữ liệu') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Dữ liệu bị trùng') {
    return new AppError(409, 'CONFLICT', message);
  }
}

module.exports = AppError;
