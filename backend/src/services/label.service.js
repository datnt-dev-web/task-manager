const AppError = require('../utils/AppError');

class LabelService {
  constructor({ labelRepository, projectAccessService }) {
    this.labelRepository = labelRepository;
    this.access = projectAccessService;
  }

  async list(user, projectId) {
    await this.access.assert(user, projectId, 'viewer');
    return this.labelRepository.listByProject(projectId);
  }

  async create(user, projectId, data) {
    await this.access.assert(user, projectId, 'manager');
    return this.labelRepository.create({ ...data, projectId });
  }

  async update(user, labelId, data) {
    const label = await this.#load(user, labelId);
    return label.update(data);
  }

  async remove(user, labelId) {
    const label = await this.#load(user, labelId);
    await label.destroy();
  }

  async #load(user, labelId) {
    const label = await this.labelRepository.findById(labelId);
    if (!label) throw AppError.notFound('Không tìm thấy nhãn');
    await this.access.assert(user, label.projectId, 'manager');
    return label;
  }
}

module.exports = LabelService;
