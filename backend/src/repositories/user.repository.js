const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
  findByEmail(email, options = {}) {
    return this.findOne({ email: String(email).trim().toLowerCase() }, options);
  }

  findByGoogleId(googleId, options = {}) {
    return this.findOne({ googleId }, options);
  }

  findByEmails(emails, options = {}) {
    return this.findAll({ email: { [Op.in]: emails } }, options);
  }

  search({ q, status, limit, offset }) {
    const where = {};
    if (status) where.status = status;
    if (q) {
      where[Op.or] = [{ email: { [Op.iLike]: `%${q}%` } }, { fullName: { [Op.iLike]: `%${q}%` } }];
    }
    return this.model.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['fullName', 'ASC NULLS LAST'],
        ['email', 'ASC'],
      ],
    });
  }
}

module.exports = UserRepository;
