const BaseRepository = require('./base.repository');

class BoardRepository extends BaseRepository {
  findByProjectId(projectId, options = {}) {
    return this.findOne({ projectId }, options);
  }
}

module.exports = BoardRepository;
