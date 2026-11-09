const AppError = require('../utils/AppError');
const { GAP, positionBetween, needsRebalance } = require('../utils/position');
const ActivityService = require('./activity.service');

const DEFAULT_SPRINT_DAYS = 14;

const todayIso = (timeZone) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
const addDaysIso = (iso, days) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/**
 * SPR-01..08: backlog & sprint (Scrum).
 * - Backlog = việc chưa vào sprint nào và chưa xong, xếp theo thứ tự ưu tiên (backlogRank).
 * - Mỗi dự án tối đa 1 sprint đang chạy; khi có sprint đang chạy, bảng chỉ hiện việc của sprint đó.
 * - Hoàn thành sprint: việc chưa xong chuyển về backlog hoặc sang sprint kế tiếp.
 */
class SprintService {
  constructor({
    unitOfWork,
    sprintRepository,
    taskRepository,
    projectRepository,
    taskService,
    activityService,
    projectAccessService,
    config,
  }) {
    this.unitOfWork = unitOfWork;
    this.sprintRepository = sprintRepository;
    this.taskRepository = taskRepository;
    this.projectRepository = projectRepository;
    this.taskService = taskService;
    this.activity = activityService;
    this.access = projectAccessService;
    this.config = config;
  }

  /** Màn hình Backlog: các sprint chưa hoàn thành (kèm việc) + backlog. */
  async getBacklog(user, projectId) {
    const { role } = await this.access.assert(user, projectId, 'viewer');
    const sprints = await this.sprintRepository.listOpen(projectId);
    const tasks = await this.taskRepository.listForPlanning(projectId, sprints.map((s) => s.id));
    const bySprint = new Map(sprints.map((s) => [s.id, []]));
    const backlog = [];
    for (const task of tasks) (task.sprintId ? bySprint.get(task.sprintId) : backlog)?.push(task);
    return {
      sprints: sprints.map((s) => ({ ...s.toJSON(), tasks: bySprint.get(s.id) })),
      backlog,
      role,
    };
  }

  async listCompleted(user, projectId) {
    await this.access.assert(user, projectId, 'viewer');
    return this.sprintRepository.listCompleted(projectId);
  }

  /** SPR-02: tên mặc định "{KEY} Sprint N". */
  async create(user, projectId, { name, goal, startDate, endDate }) {
    await this.access.assert(user, projectId, 'manager');
    this.#assertDates(startDate, endDate);
    return this.unitOfWork.run(async (transaction) => {
      const project = await this.projectRepository.lockById(projectId, transaction);
      const number = project.sprintCounter + 1;
      await project.update({ sprintCounter: number }, { transaction });
      const position = (await this.sprintRepository.maxPosition(projectId, { transaction })) + 1;
      return this.sprintRepository.create(
        { projectId, name: name ?? `${project.key} Sprint ${number}`, goal: goal ?? null, startDate, endDate, position },
        { transaction },
      );
    });
  }

  async update(user, sprintId, data) {
    const sprint = await this.#load(user, sprintId);
    if (sprint.state === 'completed') throw AppError.badRequest('Sprint đã hoàn thành, không thể sửa');
    this.#assertDates(data.startDate ?? sprint.startDate, data.endDate ?? sprint.endDate);
    return sprint.update(data);
  }

  /** SPR-06: chỉ xóa sprint chưa bắt đầu; việc trong sprint trả về backlog. */
  async remove(user, sprintId) {
    const sprint = await this.#load(user, sprintId);
    if (sprint.state !== 'planned') throw AppError.badRequest('Chỉ xóa được sprint chưa bắt đầu');
    await this.unitOfWork.run(async (transaction) => {
      await this.taskRepository.update({ sprintId: sprint.id }, { sprintId: null }, { transaction });
      await sprint.destroy({ transaction });
    });
  }

  /** SPR-04: bắt đầu sprint; mặc định từ hôm nay, kéo dài 2 tuần. */
  async start(user, sprintId, { startDate, endDate } = {}) {
    const sprint = await this.#load(user, sprintId);
    if (sprint.state !== 'planned') throw AppError.badRequest('Sprint này đã bắt đầu hoặc đã hoàn thành');
    const active = await this.sprintRepository.findActive(sprint.projectId);
    if (active) throw AppError.conflict(`Đang có sprint chạy: ${active.name}. Hãy hoàn thành sprint đó trước.`);

    const start = startDate ?? sprint.startDate ?? todayIso(this.config.TZ_BUSINESS);
    const end = endDate ?? sprint.endDate ?? addDaysIso(start, DEFAULT_SPRINT_DAYS);
    this.#assertDates(start, end);
    return sprint.update({ state: 'active', startDate: start, endDate: end });
  }

  /** SPR-05: hoàn thành sprint; việc chưa xong chuyển về backlog (moveTo = null) hoặc sprint chưa bắt đầu. */
  async complete(user, sprintId, { moveToSprintId = null } = {}) {
    const sprint = await this.#load(user, sprintId);
    if (sprint.state !== 'active') throw AppError.badRequest('Chỉ hoàn thành được sprint đang chạy');
    let target = null;
    if (moveToSprintId) {
      target = await this.sprintRepository.findById(moveToSprintId);
      if (!target || target.projectId !== sprint.projectId || target.state !== 'planned') {
        throw AppError.badRequest('Sprint nhận phải là sprint chưa bắt đầu của cùng dự án');
      }
    }

    const [doneCount, total] = await Promise.all([
      this.taskRepository.countDoneBySprint(sprint.id),
      this.taskRepository.countBySprint(sprint.id),
    ]);
    const moved = await this.unitOfWork.run(async (transaction) => {
      const count = await this.taskRepository.moveIncomplete(sprint.id, target?.id ?? null, { transaction });
      await sprint.update({ state: 'completed', completedAt: new Date() }, { transaction });
      return count;
    });
    return { sprint, completed: doneCount, total, moved, movedTo: target ? target.name : 'backlog' };
  }

  /**
   * SPR-03: kéo thả công việc giữa backlog và các sprint / sắp xếp ưu tiên.
   * `sprintId = null` là backlog; prevTaskId/nextTaskId là việc liền trên/dưới vị trí thả.
   */
  async plan(user, taskKey, { sprintId, prevTaskId, nextTaskId }) {
    // Lập kế hoạch sprint là việc của Quản trị viên / Quản lý dự án.
    const { task } = await this.taskService.loadForAccess(user, taskKey, 'manager');
    if (sprintId) {
      const sprint = await this.sprintRepository.findById(sprintId);
      if (!sprint || sprint.projectId !== task.projectId || sprint.state === 'completed') {
        throw AppError.badRequest('Sprint không hợp lệ hoặc đã hoàn thành');
      }
    }
    const before = ActivityService.snapshot(task);

    await this.unitOfWork.run(async (transaction) => {
      let rank = await this.#rankFor(task.projectId, sprintId, prevTaskId, nextTaskId, transaction);
      if (rank === null) {
        await this.taskRepository.rebalanceBacklog(task.projectId, sprintId, GAP, { transaction });
        rank = await this.#rankFor(task.projectId, sprintId, prevTaskId, nextTaskId, transaction);
      }
      await task.update({ sprintId: sprintId ?? null, backlogRank: rank }, { transaction });
    });

    const saved = await this.taskRepository.findByKey(taskKey);
    await this.activity.record(user, saved, ActivityService.diff(before, ActivityService.snapshot(saved)));
    return saved;
  }

  async #rankFor(projectId, sprintId, prevTaskId, nextTaskId, transaction) {
    const ids = [prevTaskId, nextTaskId].filter(Boolean);
    if (ids.length === 0) return positionBetween(await this.taskRepository.maxBacklogRank(projectId, { transaction }), null);
    const rows = await this.taskRepository.findBacklogRanks(ids, { transaction });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const prev = prevTaskId ? byId.get(prevTaskId) : null;
    const next = nextTaskId ? byId.get(nextTaskId) : null;
    const sameList = (r) => (r.sprintId ?? null) === (sprintId ?? null);
    if ((prevTaskId && !prev) || (nextTaskId && !next) || [prev, next].some((r) => r && !sameList(r))) {
      throw AppError.badRequest('Vị trí thả không hợp lệ, vui lòng tải lại trang');
    }
    if (needsRebalance(prev?.backlogRank, next?.backlogRank)) return null;
    return positionBetween(prev?.backlogRank, next?.backlogRank);
  }

  #assertDates(startDate, endDate) {
    if (startDate && endDate && endDate < startDate) throw AppError.badRequest('Ngày kết thúc phải sau ngày bắt đầu');
  }

  async #load(user, sprintId) {
    const sprint = await this.sprintRepository.findById(sprintId);
    if (!sprint) throw AppError.notFound('Không tìm thấy sprint');
    await this.access.assert(user, sprint.projectId, 'manager');
    return sprint;
  }
}

module.exports = SprintService;
