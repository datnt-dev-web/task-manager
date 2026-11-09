'use strict';

/** Thêm loại thông báo "task_returned" (Admin trả lại công việc kèm lý do). */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'task_returned'`);
  },

  // Postgres không xóa được giá trị enum; chỉ dọn dữ liệu dùng giá trị này.
  async down(queryInterface) {
    await queryInterface.sequelize.query(`DELETE FROM notifications WHERE type = 'task_returned'`);
  },
};
