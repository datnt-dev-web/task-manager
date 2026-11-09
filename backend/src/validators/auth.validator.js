const { z, text } = require('./common');

const newPassword = z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(200, 'Mật khẩu tối đa 200 ký tự');
const email = z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ'));

module.exports = {
  googleLogin: { body: z.object({ credential: z.string().min(10, 'Thiếu thông tin đăng nhập Google') }) },
  passwordLogin: {
    body: z.object({ email, password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(200) }),
  },
  forgotPassword: { body: z.object({ email }) },
  resetPassword: {
    body: z.object({ token: z.string().min(20, 'Liên kết không hợp lệ').max(200), password: newPassword }),
  },
  changePassword: {
    body: z.object({ currentPassword: z.string().max(200).optional(), newPassword }),
  },
  register: {
    body: z.object({
      fullName: text('Họ tên', 1, 120),
      email,
      password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').max(200, 'Mật khẩu tối đa 200 ký tự'),
    }),
  },
  devLogin: { body: z.object({ email: z.email('Email không hợp lệ') }) },
};
