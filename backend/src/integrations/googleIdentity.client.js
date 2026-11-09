const { OAuth2Client } = require('google-auth-library');
const AppError = require('../utils/AppError');

/** Xác minh ID token do nút "Đăng nhập bằng Google" (Google Identity Services) trả về. */
class GoogleIdentityClient {
  constructor(clientId) {
    this.clientId = clientId;
    this.client = new OAuth2Client(clientId);
  }

  async verify(idToken) {
    if (!this.clientId) throw AppError.badRequest('Hệ thống chưa cấu hình đăng nhập Google');
    let payload;
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });
      payload = ticket.getPayload();
    } catch {
      throw AppError.unauthorized('Không xác minh được tài khoản Google, vui lòng thử lại');
    }
    if (!payload?.email || !payload.email_verified) {
      throw AppError.unauthorized('Email Google chưa được xác minh');
    }
    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      fullName: payload.name || null,
      avatarUrl: payload.picture || null,
    };
  }
}

module.exports = GoogleIdentityClient;
