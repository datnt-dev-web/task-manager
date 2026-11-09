const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');

class SprintRepository extends BaseRepository {
  findActive(projectId, options = {}) {
    return this.findOne({ projectId, state: 'active' }, options);
  }

  /** Sprint chưa hoàn thành: đang chạy lên đầu, sau đó theo thứ tự tạo. */
  listOpen(projectId) {
    return this.model.findAll({
      where: { projectId, state: { [Op.ne]: 'completed' } },
      order: [
        [this.model.sequelize.literal(`CASE WHEN state = 'active' THEN 0 ELSE 1 END`), 'ASC'],
        ['position', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
  }

  listCompleted(projectId, { limit = 20 } = {}) {
    return this.model.findAll({ where: { projectId, state: 'completed' }, order: [['completedAt', 'DESC']], limit });
  }

  async maxPosition(projectId, options = {}) {
    return (await this.model.max('position', { where: { projectId }, ...options })) ?? 0;
  }
}

module.exports = SprintRepository;
