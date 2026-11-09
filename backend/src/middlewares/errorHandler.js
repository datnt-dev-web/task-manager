const { ZodError } = require('zod');
const multer = require('multer');
const env = require('../config/env');
const { UniqueConstraintError, ForeignKeyConstraintError, ValidationError } = require('sequelize');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const send = (res, status, code, message, details) =>
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  if (err instanceof AppError) return send(res, err.status, err.code, err.message, err.details);

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return send(res, 400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', details);
  }

  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: `Mỗi tệp tối đa ${env.MAX_UPLOAD_MB} MB`,
      LIMIT_FILE_COUNT: 'Mỗi lần tải lên tối đa 10 tệp',
      LIMIT_UNEXPECTED_FILE: 'Trường tệp phải tên là "files"',
    };
    return send(res, 400, 'UPLOAD_ERROR', messages[err.code] ?? 'Không tải lên được tệp');
  }

  if (err instanceof UniqueConstraintError) return send(res, 409, 'CONFLICT', 'Dữ liệu đã tồn tại');
  if (err instanceof ForeignKeyConstraintError) return send(res, 400, 'BAD_REFERENCE', 'Dữ liệu tham chiếu không tồn tại');
  if (err instanceof ValidationError) return send(res, 400, 'VALIDATION_ERROR', err.message);
  if (err.type === 'entity.parse.failed') return send(res, 400, 'INVALID_JSON', 'Nội dung gửi lên không phải JSON hợp lệ');
  if (err.type === 'entity.too.large') return send(res, 413, 'PAYLOAD_TOO_LARGE', 'Nội dung gửi lên quá lớn');

  logger.error(`${req.method} ${req.originalUrl}`, err);
  return send(res, 500, 'INTERNAL_ERROR', 'Đã có lỗi xảy ra, vui lòng thử lại sau');
};
