'use strict';

const DEFAULT_EMAIL_SETTINGS = {
  taskAssigned: true,
  mentioned: true,
  dueSoon: true,
  overdue: true,
  addedToProject: true,
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const timestamps = {
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    };
    const taskRef = {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'tasks', key: 'id' },
      onDelete: 'CASCADE',
    };

    // NTF-03: bật/tắt email theo loại sự kiện
    await queryInterface.addColumn('users', 'email_settings', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: DEFAULT_EMAIL_SETTINGS,
    });

    // TSK-07: việc con
    await queryInterface.createTable('subtasks', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      task_id: taskRef,
      title: { type: Sequelize.STRING(255), allowNull: false },
      is_done: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      assignee_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      due_date: { type: Sequelize.DATEONLY },
      position: { type: Sequelize.DOUBLE, allowNull: false },
      ...timestamps,
    });
    await queryInterface.addIndex('subtasks', ['task_id', 'position']);
    await queryInterface.addIndex('subtasks', ['assignee_id']);

    // TSK-08: người theo dõi
    await queryInterface.createTable('task_watchers', {
      task_id: { ...taskRef, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('task_watchers', ['user_id']);

    // ATT: tệp đính kèm
    await queryInterface.createTable('attachments', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      task_id: taskRef,
      uploaded_by_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      file_name: { type: Sequelize.STRING(255), allowNull: false },
      mime_type: { type: Sequelize.STRING(120), allowNull: false },
      size: { type: Sequelize.INTEGER, allowNull: false },
      storage_key: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('attachments', ['task_id', 'created_at']);

    // NTF: thông báo trong ứng dụng
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM(
          'task_assigned',
          'mentioned',
          'comment_added',
          'status_changed',
          'added_to_project',
          'due_soon',
          'overdue',
        ),
        allowNull: false,
      },
      actor_id: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      project_id: { type: Sequelize.UUID, references: { model: 'projects', key: 'id' }, onDelete: 'CASCADE' },
      task_id: { type: Sequelize.UUID, references: { model: 'tasks', key: 'id' }, onDelete: 'CASCADE' },
      data: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      read_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
    await queryInterface.addIndex('notifications', ['user_id', 'read_at']);
    await queryInterface.addIndex('notifications', ['user_id', 'created_at']);
    await queryInterface.addIndex('notifications', ['task_id', 'type', 'user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('attachments');
    await queryInterface.dropTable('task_watchers');
    await queryInterface.dropTable('subtasks');
    await queryInterface.removeColumn('users', 'email_settings');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
  },
};
