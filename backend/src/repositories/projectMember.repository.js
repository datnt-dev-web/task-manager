const BaseRepository = require('./base.repository');
const { USER_PUBLIC_ATTRIBUTES } = require('./attributes');

class ProjectMemberRepository extends BaseRepository {
  constructor(model, { User }) {
    super(model);
    this.User = User;
  }

  findMembership(projectId, userId, options = {}) {
    return this.findOne({ projectId, userId }, options);
  }

  listMembers(projectId) {
    return this.model.findAll({
      where: { projectId },
      include: [{ model: this.User, as: 'user', attributes: USER_PUBLIC_ATTRIBUTES }],
      order: [[{ model: this.User, as: 'user' }, 'fullName', 'ASC NULLS LAST']],
    });
  }

  async listProjectIds(userId) {
    const rows = await this.findAll({ userId }, { attributes: ['projectId'] });
    return rows.map((r) => r.projectId);
  }

  countManagers(projectId, options = {}) {
    return this.count({ projectId, role: 'manager' }, options);
  }
}

module.exports = ProjectMemberRepository;
