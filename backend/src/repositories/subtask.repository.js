const BaseRepository = require('./base.repository');

class SubtaskRepository extends BaseRepository {
  async maxPosition(taskId, options = {}) {
    return (await this.model.max('position', { where: { taskId }, ...options })) ?? null;
  }

  countByTask(taskId, options = {}) {
    return this.count({ taskId }, options);
  }

  /** BR-02: bỏ giao việc con chưa xong khi người dùng rời dự án / thành Người xem. */
  async unassignOpenInProject(projectId, userId, options = {}) {
    await this.model.sequelize.query(
      `UPDATE subtasks SET assignee_id = NULL, updated_at = now()
       WHERE assignee_id = :userId AND is_done = false
         AND task_id IN (SELECT id FROM tasks WHERE project_id = :projectId)`,
      { replacements: { projectId, userId }, ...options },
    );
  }
}

module.exports = SubtaskRepository;
