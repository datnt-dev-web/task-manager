const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');
const { USER_BRIEF_ATTRIBUTES } = require('./attributes');

class AttachmentRepository extends BaseRepository {
  constructor(model, { User, Task, Project }) {
    super(model);
    this.User = User;
    this.Task = Task;
    this.Project = Project;
  }

  listByTask(taskId) {
    return this.model.findAll({
      where: { taskId },
      include: [{ model: this.User, as: 'uploadedBy', attributes: USER_BRIEF_ATTRIBUTES }],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Kho tệp: tìm tệp trên nhiều dự án, kèm công việc + dự án chứa tệp.
   * `projectIds = null` nghĩa là mọi dự án (Quản trị viên). Tệp của công việc đã xóa không hiện.
   */
  search({ projectIds, q, mimeTypes, uploaderId, sort, limit, offset }) {
    const where = {};
    if (q) where.fileName = { [Op.iLike]: `%${q}%` };
    if (mimeTypes) where.mimeType = { [Op.in]: mimeTypes };
    if (uploaderId) where.uploadedById = uploaderId;

    const order = {
      newest: [['createdAt', 'DESC']],
      oldest: [['createdAt', 'ASC']],
      name: [['fileName', 'ASC']],
      size: [['size', 'DESC']],
    }[sort] ?? [['createdAt', 'DESC']];

    return this.model.findAndCountAll({
      where,
      include: [
        { model: this.User, as: 'uploadedBy', attributes: USER_BRIEF_ATTRIBUTES },
        {
          model: this.Task,
          as: 'task',
          required: true,
          attributes: ['id', 'key', 'title', 'projectId'],
          where: projectIds ? { projectId: { [Op.in]: projectIds } } : undefined,
          include: [{ model: this.Project, as: 'project', required: true, attributes: ['id', 'key', 'name', 'color', 'archivedAt'] }],
        },
      ],
      order,
      limit,
      offset,
      distinct: true,
    });
  }

  findManyWithUploader(ids) {
    return this.model.findAll({
      where: { id: ids },
      include: [{ model: this.User, as: 'uploadedBy', attributes: USER_BRIEF_ATTRIBUTES }],
      order: [['createdAt', 'DESC']],
    });
  }
}

module.exports = AttachmentRepository;
