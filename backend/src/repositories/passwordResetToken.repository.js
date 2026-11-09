const BaseRepository = require('./base.repository');

class PasswordResetTokenRepository extends BaseRepository {
  findByHash(tokenHash, options = {}) {
    return this.findOne({ tokenHash }, options);
  }

  /** Vô hiệu các token chưa dùng của người dùng (khi tạo token mới hoặc đã đổi mật khẩu). */
  invalidateForUser(userId, options = {}) {
    return this.update({ userId, usedAt: null }, { usedAt: new Date() }, options);
  }
}

module.exports = PasswordResetTokenRepository;
