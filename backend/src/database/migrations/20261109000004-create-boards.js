'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const timestamps = {
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    };

    await queryInterface.createTable('boards', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      ...timestamps,
    });
    await queryInterface.addIndex('boards', ['project_id']);

    await queryInterface.createTable('board_columns', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      board_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'boards', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(30), allowNull: false },
      position: { type: Sequelize.INTEGER, allowNull: false },
      is_done: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      ...timestamps,
    });
    await queryInterface.addIndex('board_columns', ['board_id', 'position']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('board_columns');
    await queryInterface.dropTable('boards');
  },
};
