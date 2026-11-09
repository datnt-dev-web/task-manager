const BaseRepository = require('./base.repository');

class BoardColumnRepository extends BaseRepository {
  listByBoard(boardId, options = {}) {
    return this.findAll({ boardId }, { order: [['position', 'ASC']], ...options });
  }

  /** Cột kèm board để biết cột thuộc dự án nào. */
  findWithBoard(id, options = {}) {
    return this.model.findByPk(id, { include: [{ association: 'board' }], ...options });
  }
}

module.exports = BoardColumnRepository;
