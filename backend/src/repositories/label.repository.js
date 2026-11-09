const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');

class LabelRepository extends BaseRepository {
  listByProject(projectId) {
    return this.findAll({ projectId }, { order: [['name', 'ASC']] });
  }

  countInProject(projectId, ids, options = {}) {
    return this.count({ projectId, id: { [Op.in]: ids } }, options);
  }
}

module.exports = LabelRepository;
