const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');

class TokenService {
  constructor({ refreshTokenRepository, config }) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.config = config;
  }

  signAccessToken(user) {
    return jwt.sign({ sub: user.id }, this.config.JWT_ACCESS_SECRET, { expiresIn: this.config.JWT_ACCESS_TTL });
  }

  verifyAccessToken(token) {
    return jwt.verify(token, this.config.JWT_ACCESS_SECRET);
  }

  async issueRefreshToken(userId, options = {}) {
    const raw = crypto.randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + this.config.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
    await this.refreshTokenRepository.create({ userId, tokenHash: hash(raw), expiresAt }, options);
    return raw;
  }

  async issuePair(user) {
    return { accessToken: this.signAccessToken(user), refreshToken: await this.issueRefreshToken(user.id) };
  }

  /**
   * Đổi refresh token cũ lấy cặp token mới (rotation).
   * Nếu token đã bị thu hồi mà vẫn được dùng lại → nghi bị đánh cắp → thu hồi toàn bộ phiên của người dùng.
   */
  async rotate(rawToken) {
    if (!rawToken) throw AppError.unauthorized();
    const record = await this.refreshTokenRepository.findByHash(hash(rawToken));
    if (!record) throw AppError.unauthorized('Phiên đăng nhập không hợp lệ');
    if (record.revokedAt) {
      await this.refreshTokenRepository.revokeAllForUser(record.userId);
      throw AppError.unauthorized('Phiên đăng nhập đã bị thu hồi, vui lòng đăng nhập lại');
    }
    if (record.expiresAt < new Date()) throw AppError.unauthorized('Phiên đăng nhập đã hết hạn');

    await this.refreshTokenRepository.revokeById(record.id);
    return { userId: record.userId };
  }

  async revoke(rawToken) {
    if (!rawToken) return;
    const record = await this.refreshTokenRepository.findByHash(hash(rawToken));
    if (record) await this.refreshTokenRepository.revokeById(record.id);
  }

  revokeAllForUser(userId, options = {}) {
    return this.refreshTokenRepository.revokeAllForUser(userId, options);
  }
}

module.exports = TokenService;
