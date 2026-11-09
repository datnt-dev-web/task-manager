const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');
const { USER_BRIEF_ATTRIBUTES } = require('./attributes');

class NotificationRepository extends BaseRepository {
  constructor(model, { User, Task, Project }) {
    super(model);
    this.User = User;
    this.Task = Task;
    this.Project = Project;
  }

  listForUser(userId, { unreadOnly, limit, offset }) {
    return this.model.findAndCountAll({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      include: [
        { model: this.User, as: 'actor', attributes: USER_BRIEF_ATTRIBUTES },
        { model: this.Task, as: 'task', attributes: ['id', 'key', 'title', 'projectId'] },
        { model: this.Project, as: 'project', attributes: ['id', 'key', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
  }

  countUnread(userId) {
    return this.count({ userId, readAt: null });
  }

  markRead(userId, ids) {
    const where = { userId, readAt: null };
    if (ids) where.id = { [Op.in]: ids };
    return this.update(where, { readAt: new Date() });
  }

  /** Chống gửi nhắc trùng (ví dụ server khởi động lại trong ngày). */
  async existsSince({ type, taskId, userId, since }) {
    return (await this.count({ type, taskId, userId, createdAt: { [Op.gte]: since } })) > 0;
  }
}

module.exports = NotificationRepository;
