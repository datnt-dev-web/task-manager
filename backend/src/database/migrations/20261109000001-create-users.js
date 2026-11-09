'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      google_id: { type: Sequelize.STRING(64), unique: true },
      password_hash: { type: Sequelize.STRING(255) },
      full_name: { type: Sequelize.STRING(120) },
      avatar_url: { type: Sequelize.STRING(1000) },
      title: { type: Sequelize.STRING(120) },
      is_admin: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      status: { type: Sequelize.ENUM('invited', 'active', 'disabled'), allowNull: false, defaultValue: 'invited' },
      theme: { type: Sequelize.ENUM('light', 'dark', 'system'), allowNull: false, defaultValue: 'system' },
      last_login_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status"; DROP TYPE IF EXISTS "enum_users_theme";');
  },
};
