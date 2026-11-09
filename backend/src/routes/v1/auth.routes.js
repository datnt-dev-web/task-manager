const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../../middlewares/validate');
const v = require('../../validators/auth.validator');

module.exports = ({ controllers, middlewares }) => {
  const router = Router();
  const c = controllers.auth;
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    // Chỉ đếm lần đăng nhập thất bại: chống dò tài khoản mà không chặn người dùng hợp lệ.
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Bạn thử đăng nhập quá nhiều lần, vui lòng đợi ít phút' } },
  });

  router.post('/google', loginLimiter, validate(v.googleLogin), c.googleLogin);
  // Quên mật khẩu: đếm mọi lượt (kể cả thành công) để chống spam email.
  const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Bạn yêu cầu quá nhiều lần, vui lòng đợi ít phút' } },
  });
  router.post('/forgot-password', resetLimiter, validate(v.forgotPassword), c.forgotPassword);
  router.post('/reset-password', loginLimiter, validate(v.resetPassword), c.resetPassword);
  router.post('/password', middlewares.authenticate, validate(v.changePassword), c.changePassword);
  router.post('/login', loginLimiter, validate(v.passwordLogin), c.passwordLogin);
  router.post('/register', loginLimiter, validate(v.register), c.register);
  router.post('/dev-login', loginLimiter, validate(v.devLogin), c.devLogin);
  router.post('/refresh', c.refresh);
  router.post('/logout', c.logout);
  router.get('/me', middlewares.authenticate, c.me);

  return router;
};
