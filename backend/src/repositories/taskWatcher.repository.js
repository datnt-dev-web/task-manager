const BaseRepository = require('./base.repository');

class TaskWatcherRepository extends BaseRepository {
  /** Thêm nhiều người theo dõi, bỏ qua người đã theo dõi. */
  async addMany(taskId, userIds, options = {}) {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return;
    await this.model.bulkCreate(
      unique.map((userId) => ({ taskId, userId })),
      { ignoreDuplicates: true, ...options },
    );
  }

  remove(taskId, userId, options = {}) {
    return this.destroy({ taskId, userId }, options);
  }

  async isWatching(taskId, userId) {
    return (await this.count({ taskId, userId })) > 0;
  }

  async listUserIds(taskId, options = {}) {
    const rows = await this.findAll({ taskId }, { attributes: ['userId'], ...options });
    return rows.map((r) => r.userId);
  }
}

module.exports = TaskWatcherRepository;
