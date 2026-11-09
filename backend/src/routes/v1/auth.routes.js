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
  router.post('/dev-login', loginLimiter, validate(v.devLogin), c.devLogin);
  router.post('/refresh', c.refresh);
  router.post('/logout', c.logout);
  router.get('/me', middlewares.authenticate, c.me);

  return router;
};
