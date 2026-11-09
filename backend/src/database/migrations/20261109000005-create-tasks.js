'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const timestamps = {
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    };

    await queryInterface.createTable('labels', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(50), allowNull: false },
      color: { type: Sequelize.STRING(16), allowNull: false },
      ...timestamps,
    });
    await queryInterface.addIndex('labels', ['project_id', 'name'], { unique: true });

    await queryInterface.createTable('tasks', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
      },
      number: { type: Sequelize.INTEGER, allowNull: false },
      key: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      type: { type: Sequelize.ENUM('task', 'bug'), allowNull: false, defaultValue: 'task' },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.JSONB },
      description_text: { type: Sequelize.TEXT },
      column_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'board_columns', key: 'id' } },
      assignee_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      creator_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      priority: {
        type: Sequelize.ENUM('urgent', 'high', 'medium', 'low'),
        allowNull: false,
        defaultValue: 'medium',
      },
      due_date: { type: Sequelize.DATEONLY },
      position: { type: Sequelize.DOUBLE, allowNull: false },
      completed_at: { type: Sequelize.DATE },
      ...timestamps,
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('tasks', ['project_id', 'number'], { unique: true });
    await queryInterface.addIndex('tasks', ['column_id', 'position']);
    await queryInterface.addIndex('tasks', ['assignee_id', 'due_date']);
    await queryInterface.sequelize.query(
      `CREATE INDEX tasks_search_idx ON tasks
       USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description_text, '')))`,
    );

    await queryInterface.createTable('task_labels', {
      task_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'CASCADE',
      },
      label_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'labels', key: 'id' },
        onDelete: 'CASCADE',
      },
    });
    await queryInterface.addIndex('task_labels', ['label_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('task_labels');
    await queryInterface.dropTable('tasks');
    await queryInterface.dropTable('labels');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_type"; DROP TYPE IF EXISTS "enum_tasks_priority";');
  },
};
