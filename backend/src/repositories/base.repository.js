/**
 * Repository cơ sở: lớp duy nhất được truy cập model Sequelize.
 * Service chỉ gọi repository, nhờ vậy có thể đổi ORM/nguồn dữ liệu hoặc mock khi test.
 * Mọi phương thức nhận `options` (ví dụ { transaction }) để tham gia transaction của service.
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  findById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  findOne(where, options = {}) {
    return this.model.findOne({ where, ...options });
  }

  findAll(where = {}, options = {}) {
    return this.model.findAll({ where, ...options });
  }

  count(where = {}, options = {}) {
    return this.model.count({ where, ...options });
  }

  create(data, options = {}) {
    return this.model.create(data, options);
  }

  bulkCreate(rows, options = {}) {
    return this.model.bulkCreate(rows, options);
  }

  async update(where, data, options = {}) {
    const [affected] = await this.model.update(data, { where, ...options });
    return affected;
  }

  destroy(where, options = {}) {
    return this.model.destroy({ where, ...options });
  }
}

module.exports = BaseRepository;
