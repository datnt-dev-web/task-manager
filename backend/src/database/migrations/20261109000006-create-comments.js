'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('comments', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'CASCADE',
      },
      author_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      body: { type: Sequelize.JSONB, allowNull: false },
      body_text: { type: Sequelize.TEXT },
      edited_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('comments', ['task_id', 'created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('comments');
  },
};
