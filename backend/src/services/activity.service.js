const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const nameOf = (user) => (user ? user.fullName || user.email?.split('@')[0] : null);

/** Ảnh chụp các trường cần theo dõi lịch sử (giá trị hiển thị được, không cần tra cứu lại). */
function snapshot(task) {
  return {
    title: task.title,
    type: task.type,
    priority: task.priority,
    dueDate: task.dueDate ?? null,
    assignee: nameOf(task.assignee),
    status: task.column?.name ?? null,
    labels: (task.labels ?? []).map((l) => l.name).sort().join(', ') || null,
    sprint: task.sprint?.name ?? null,
  };
}

/**
 * TSK-09 / AUD-01: lịch sử thay đổi công việc — ai, khi nào, trường nào, giá trị cũ → mới.
 * Ghi lịch sử không được làm hỏng thao tác chính: lỗi chỉ ghi log.
 */
class ActivityService {
  constructor({ activityLogRepository, taskRepository, projectAccessService }) {
    this.activityLogRepository = activityLogRepository;
    this.taskRepository = taskRepository;
    this.access = projectAccessService;
  }

  /** So sánh 2 ảnh chụp → danh sách thay đổi. */
  static diff(before, after) {
    return Object.keys(after)
      .filter((field) => (before[field] ?? null) !== (after[field] ?? null))
      .map((field) => ({ action: 'updated', field, from: before[field], to: after[field] }));
  }

  static snapshot = snapshot;

  async record(actor, task, entries) {
    if (!entries?.length) return;
    try {
      await this.activityLogRepository.bulkCreate(
        entries.map((e) => ({
          projectId: task.projectId,
          taskId: task.id,
          actorId: actor?.id ?? null,
          action: e.action,
          field: e.field ?? null,
          oldValue: e.from == null ? null : String(e.from).slice(0, 1000),
          newValue: e.to == null ? null : String(e.to).slice(0, 1000),
        })),
      );
    } catch (err) {
      logger.error('Không ghi được lịch sử thay đổi:', err);
    }
  }

  async list(user, taskKey) {
    const task = await this.taskRepository.findOne({ key: taskKey });
    if (!task) throw AppError.notFound(`Không tìm thấy công việc ${taskKey}`);
    await this.access.assert(user, task.projectId, 'viewer');
    return this.activityLogRepository.listByTask(task.id);
  }
}

module.exports = ActivityService;
