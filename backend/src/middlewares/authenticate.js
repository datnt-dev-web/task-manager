const AppError = require('../utils/AppError');
const { ACCESS_COOKIE } = require('../utils/cookies');

/** Xác thực access token, nạp người dùng vào req.user. Tài khoản bị khóa bị chặn ngay lập tức. */
module.exports = ({ tokenService, userRepository }) =>
  async (req, _res, next) => {
    const header = req.headers.authorization;
    const token = req.cookies?.[ACCESS_COOKIE] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
    if (!token) throw AppError.unauthorized();

    let payload;
    try {
      payload = tokenService.verifyAccessToken(token);
    } catch {
      throw AppError.unauthorized('Phiên đăng nhập đã hết hạn');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || user.status !== 'active') throw AppError.unauthorized('Tài khoản không còn quyền truy cập');

    req.user = user;
    next();
  };
