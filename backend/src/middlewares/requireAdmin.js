const AppError = require('../utils/AppError');

module.exports = (req, _res, next) => {
  if (!req.user?.isAdmin) throw AppError.forbidden('Chỉ Quản trị viên được thực hiện thao tác này');
  next();
};
