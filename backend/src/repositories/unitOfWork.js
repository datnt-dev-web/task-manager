/**
 * Bao transaction để service không phụ thuộc trực tiếp vào Sequelize.
 * Dùng: await unitOfWork.run(async (transaction) => { ...repo.create(data, { transaction }) })
 */
class UnitOfWork {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }

  run(work) {
    return this.sequelize.transaction(work);
  }
}

module.exports = UnitOfWork;
