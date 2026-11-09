const BaseRepository = require('./base.repository');
const { USER_BRIEF_ATTRIBUTES } = require('./attributes');

class CommentRepository extends BaseRepository {
  constructor(model, { User }) {
    super(model);
    this.User = User;
  }

  listByTask(taskId, { order = 'asc' } = {}) {
    return this.model.findAll({
      where: { taskId },
      include: [{ model: this.User, as: 'author', attributes: USER_BRIEF_ATTRIBUTES }],
      order: [['createdAt', order === 'desc' ? 'DESC' : 'ASC']],
    });
  }

  findWithAuthor(id, options = {}) {
    return this.model.findByPk(id, {
      include: [{ model: this.User, as: 'author', attributes: USER_BRIEF_ATTRIBUTES }],
      ...options,
    });
  }
}

module.exports = CommentRepository;
