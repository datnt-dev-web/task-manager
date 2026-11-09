'use strict';

/**
 * Tạo Quản trị viên đầu tiên từ INITIAL_ADMIN_EMAIL.
 * Người này đăng nhập bằng Google với đúng email đó để kích hoạt tài khoản.
 */
module.exports = {
  async up(queryInterface) {
    const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    if (!email) {
      console.warn('Bỏ qua seeder: chưa đặt INITIAL_ADMIN_EMAIL');
      return;
    }
    await queryInterface.sequelize.query(
      `INSERT INTO users (email, is_admin, status) VALUES (:email, true, 'invited')
       ON CONFLICT (email) DO UPDATE SET is_admin = true`,
      { replacements: { email } },
    );
  },

  async down(queryInterface) {
    const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    if (email) await queryInterface.bulkDelete('users', { email });
  },
};
