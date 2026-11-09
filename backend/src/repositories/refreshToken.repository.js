const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');

class RefreshTokenRepository extends BaseRepository {
  findByHash(tokenHash, options = {}) {
    return this.findOne({ tokenHash }, options);
  }

  revokeById(id, options = {}) {
    return this.update({ id, revokedAt: null }, { revokedAt: new Date() }, options);
  }

  revokeAllForUser(userId, options = {}) {
    return this.update({ userId, revokedAt: null }, { revokedAt: new Date() }, options);
  }

  deleteExpired() {
    return this.destroy({ expiresAt: { [Op.lt]: new Date() } });
  }
}

module.exports = RefreshTokenRepository;
