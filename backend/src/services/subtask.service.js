const AppError = require('../utils/AppError');
const { positionBetween } = require('../utils/position');

const MAX_SUBTASKS = 50;

/** TSK-07: việc con — tick hoàn thành, giao người và đặt hạn riêng. */
class SubtaskService {
  constructor({
    subtaskRepository,
    taskRepository,
    taskService,
    taskWatcherRepository,
    notificationService,
    activityService,
    projectAccessService,
  }) {
    this.activity = activityService;
    this.subtaskRepository = subtaskRepository;
    this.taskRepository = taskRepository;
    this.taskService = taskService;
    this.watchers = taskWatcherRepository;
    this.notifications = notificationService;
    this.access = projectAccessService;
  }

  async create(user, taskKey, { title, assigneeId, dueDate }) {
    const { task } = await this.taskService.loadForAccess(user, taskKey, 'member');
    if ((await this.subtaskRepository.countByTask(task.id)) >= MAX_SUBTASKS) {
      throw AppError.badRequest(`Mỗi công việc có tối đa ${MAX_SUBTASKS} việc con`);
    }
    if (assigneeId) await this.taskService.assertAssignable(task.projectId, assigneeId);

    const position = positionBetween(await this.subtaskRepository.maxPosition(task.id), null);
    const subtask = await this.subtaskRepository.create({
      taskId: task.id,
      title,
      assigneeId: assigneeId ?? null,
      dueDate: dueDate ?? null,
      position,
    });
    await this.activity.record(user, task, [{ action: 'subtask_added', to: title }]);
    if (assigneeId) await this.#onAssigned(user, task, subtask);
    return subtask;
  }

  async update(user, subtaskId, data) {
    const { subtask, task } = await this.#load(user, subtaskId);
    const previousAssignee = subtask.assigneeId;
    if (data.assigneeId) await this.taskService.assertAssignable(task.projectId, data.assigneeId);
    const wasDone = subtask.isDone;
    await subtask.update(data);
    if (data.isDone !== undefined && data.isDone !== wasDone) {
      await this.activity.record(user, task, [{ action: data.isDone ? 'subtask_completed' : 'subtask_reopened', to: subtask.title }]);
    }
    if (data.assigneeId && data.assigneeId !== previousAssignee) await this.#onAssigned(user, task, subtask);
    return subtask;
  }

  async remove(user, subtaskId) {
    const { subtask, task } = await this.#load(user, subtaskId);
    await subtask.destroy();
    await this.activity.record(user, task, [{ action: 'subtask_removed', from: subtask.title }]);
  }

  async #load(user, subtaskId) {
    const subtask = await this.subtaskRepository.findById(subtaskId);
    if (!subtask) throw AppError.notFound('Không tìm thấy việc con');
    const task = await this.taskRepository.findById(subtask.taskId);
    if (!task) throw AppError.notFound('Không tìm thấy công việc');
    await this.access.assert(user, task.projectId, 'member');
    return { subtask, task };
  }

  async #onAssigned(actor, task, subtask) {
    await this.watchers.addMany(task.id, [subtask.assigneeId]);
    await this.notifications.notify({
      type: 'task_assigned',
      recipientIds: [subtask.assigneeId],
      actor,
      task,
      data: { subtaskTitle: subtask.title },
    });
  }
}

module.exports = SubtaskService;
