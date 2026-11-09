'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const timestamps = {
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    };

    await queryInterface.createTable('projects', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      key: { type: Sequelize.STRING(6), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      description: { type: Sequelize.JSONB },
      icon: { type: Sequelize.STRING(32) },
      color: { type: Sequelize.STRING(16) },
      created_by_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      task_counter: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      archived_at: { type: Sequelize.DATE },
      ...timestamps,
      deleted_at: { type: Sequelize.DATE },
    });

    await queryInterface.createTable('project_members', {
      project_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: { type: Sequelize.ENUM('manager', 'member', 'viewer'), allowNull: false, defaultValue: 'member' },
      ...timestamps,
    });
    await queryInterface.addIndex('project_members', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('project_members');
    await queryInterface.dropTable('projects');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_project_members_role";');
  },
};
