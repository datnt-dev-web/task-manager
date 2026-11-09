const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');

class ProjectRepository extends BaseRepository {
  constructor(model, { ProjectMember }) {
    super(model);
    this.ProjectMember = ProjectMember;
  }

  findByKey(key, options = {}) {
    return this.findOne({ key }, options);
  }

  /** Dự án mà người dùng là thành viên, kèm vai trò của họ. */
  findForMember(userId, { archived = false } = {}) {
    return this.model.findAll({
      where: { archivedAt: archived ? { [Op.ne]: null } : null },
      include: [{ model: this.ProjectMember, as: 'members', where: { userId }, attributes: ['role'] }],
      order: [['name', 'ASC']],
    });
  }

  /** Toàn bộ dự án (Quản trị viên). */
  findAllProjects({ archived = false } = {}) {
    return this.model.findAll({
      where: { archivedAt: archived ? { [Op.ne]: null } : null },
      order: [['name', 'ASC']],
    });
  }

  /** Khóa dòng dự án trong transaction để tăng bộ đếm mã công việc an toàn. */
  lockById(id, transaction) {
    return this.model.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  }
}

module.exports = ProjectRepository;
