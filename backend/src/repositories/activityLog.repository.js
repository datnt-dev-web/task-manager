const BaseRepository = require('./base.repository');
const { USER_BRIEF_ATTRIBUTES } = require('./attributes');

class ActivityLogRepository extends BaseRepository {
  constructor(model, { User }) {
    super(model);
    this.User = User;
  }

  listByTask(taskId, { limit = 200 } = {}) {
    return this.model.findAll({
      where: { taskId },
      include: [{ model: this.User, as: 'actor', attributes: USER_BRIEF_ATTRIBUTES }],
      order: [['createdAt', 'DESC']],
      limit,
    });
  }
}

module.exports = ActivityLogRepository;
