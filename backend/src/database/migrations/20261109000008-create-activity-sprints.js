'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // TSK-09 / AUD-01: lịch sử thay đổi
    await queryInterface.createTable('activity_logs', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
      },
      task_id: { type: Sequelize.UUID, references: { model: 'tasks', key: 'id' }, onDelete: 'CASCADE' },
      actor_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      action: { type: Sequelize.STRING(40), allowNull: false },
      field: { type: Sequelize.STRING(40) },
      old_value: { type: Sequelize.TEXT },
      new_value: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('activity_logs', ['task_id', 'created_at']);
    await queryInterface.addIndex('activity_logs', ['project_id', 'created_at']);

    // SPR: sprint
    await queryInterface.createTable('sprints', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      goal: { type: Sequelize.TEXT },
      start_date: { type: Sequelize.DATEONLY },
      end_date: { type: Sequelize.DATEONLY },
      state: { type: Sequelize.ENUM('planned', 'active', 'completed'), allowNull: false, defaultValue: 'planned' },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      completed_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('sprints', ['project_id', 'state']);
    // SPR-04 / BR: mỗi dự án tối đa 1 sprint đang chạy — chặn ở tầng CSDL
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX sprints_one_active_per_project ON sprints (project_id) WHERE state = 'active'`,
    );

    await queryInterface.addColumn('projects', 'sprint_counter', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    // Công việc: thuộc sprint nào + thứ tự ưu tiên trong backlog/sprint (độc lập với thứ tự trên bảng)
    await queryInterface.addColumn('tasks', 'sprint_id', {
      type: Sequelize.UUID,
      references: { model: 'sprints', key: 'id' },
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('tasks', 'backlog_rank', { type: Sequelize.DOUBLE, allowNull: false, defaultValue: 0 });
    await queryInterface.sequelize.query('UPDATE tasks SET backlog_rank = number * 1024');
    await queryInterface.addIndex('tasks', ['project_id', 'sprint_id', 'backlog_rank']);
    await queryInterface.addIndex('tasks', ['project_id', 'due_date']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', ['project_id', 'due_date']);
    await queryInterface.removeIndex('tasks', ['project_id', 'sprint_id', 'backlog_rank']);
    await queryInterface.removeColumn('tasks', 'backlog_rank');
    await queryInterface.removeColumn('tasks', 'sprint_id');
    await queryInterface.removeColumn('projects', 'sprint_counter');
    await queryInterface.dropTable('sprints');
    await queryInterface.dropTable('activity_logs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sprints_state";');
  },
};
