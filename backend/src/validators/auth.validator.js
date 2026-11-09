const { z } = require('./common');

module.exports = {
  googleLogin: { body: z.object({ credential: z.string().min(10, 'Thiếu thông tin đăng nhập Google') }) },
  devLogin: { body: z.object({ email: z.email('Email không hợp lệ') }) },
};
