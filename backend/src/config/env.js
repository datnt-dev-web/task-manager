const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'Thiếu DATABASE_URL'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET phải dài ít nhất 32 ký tự'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  GOOGLE_CLIENT_ID: z.string().default(''),
  // Tài khoản Quản trị viên cố định (tiện test). Đặt cả hai thì mỗi lần khởi động API sẽ đảm bảo
  // tài khoản này tồn tại, là Quản trị viên, đang hoạt động và có đúng mật khẩu này.
  // KHÔNG ghi giá trị thật vào git — chỉ đặt trong .env trên máy chủ.
  INITIAL_ADMIN_EMAIL: z.string().trim().toLowerCase().default(''),
  INITIAL_ADMIN_PASSWORD: z.string().default(''),
  ALLOW_DEV_LOGIN: z.stringbool().default(false),
  COOKIE_SECURE: z.stringbool().optional(),
  // Đường dẫn gốc của ứng dụng web, dùng cho link trong email
  APP_URL: z.string().default('http://localhost:5173'),
  // Tệp đính kèm
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(10),
  // Email (bỏ trống SMTP_HOST thì chỉ ghi log)
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  MAIL_FROM: z.string().default('Task Manager <no-reply@hopphu.vn>'),
  // Tác vụ định kỳ (nhắc hạn). Chỉ bật ở 1 instance nếu chạy nhiều bản API.
  ENABLE_JOBS: z.stringbool().default(true),
  TZ_BUSINESS: z.string().default('Asia/Ho_Chi_Minh'),
  // Số tầng proxy phía trước API (production: Nginx máy chủ → Nginx container = 2) để lấy đúng IP người dùng.
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Cấu hình môi trường không hợp lệ:\n' + z.prettifyError(parsed.error));
  process.exit(1);
}

const env = parsed.data;
const isProduction = env.NODE_ENV === 'production';

if (isProduction && env.ALLOW_DEV_LOGIN) {
  console.error('ALLOW_DEV_LOGIN không được bật ở môi trường production');
  process.exit(1);
}
if (isProduction && !env.GOOGLE_CLIENT_ID) {
  console.error('Thiếu GOOGLE_CLIENT_ID ở môi trường production');
  process.exit(1);
}

module.exports = Object.freeze({
  ...env,
  isProduction,
  cookieSecure: env.COOKIE_SECURE ?? isProduction,
});
