'use strict';

/**
 * Chỉ còn 2 vai trò trong dự án: Admin (manager) và Thành viên (member).
 * Người xem cũ được chuyển thành Thành viên; tạo lại kiểu enum không còn 'viewer'.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql) => queryInterface.sequelize.query(sql, { transaction });
      await q(`UPDATE project_members SET role = 'member' WHERE role = 'viewer'`);
      await q(`ALTER TABLE project_members ALTER COLUMN role DROP DEFAULT`);
      await q(`ALTER TYPE "enum_project_members_role" RENAME TO "enum_project_members_role_old"`);
      await q(`CREATE TYPE "enum_project_members_role" AS ENUM ('manager', 'member')`);
      await q(
        `ALTER TABLE project_members ALTER COLUMN role TYPE "enum_project_members_role" USING role::text::"enum_project_members_role"`,
      );
      await q(`ALTER TABLE project_members ALTER COLUMN role SET DEFAULT 'member'`);
      await q(`DROP TYPE "enum_project_members_role_old"`);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TYPE "enum_project_members_role" ADD VALUE IF NOT EXISTS 'viewer'`);
  },
};
