const AppError = require('../utils/AppError');
const { toPlainText, sanitizeDoc, extractMentionIds } = require('../utils/richText');
const { GAP, positionBetween, needsRebalance } = require('../utils/position');
const ActivityService = require('./activity.service');

const MAX_CALENDAR_DAYS = 62;
const DUE_SOON_DAYS = 3;
const isoDateIn = (date, timeZone) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);

const ASSIGNABLE_ROLES = new Set(['manager', 'member']);
const CANNOT_MOVE = 'Bạn chỉ có thể di chuyển công việc được giao cho mình';
const NOT_YOUR_TASK = 'Bạn chỉ có thể bình luận công việc được giao cho mình';
const MEMBER_EDITABLE_FIELDS = new Set(['columnId']);
const ONLY_MANAGER_COMPLETES =
  'Chỉ Quản trị viên / Quản lý dự án được duyệt hoàn thành. Làm xong, hãy chuyển công việc sang cột Chờ duyệt.';
const SIMPLE_FIELDS = ['title', 'type', 'priority', 'dueDate', 'assigneeId'];

class TaskService {
  constructor({
    unitOfWork,
    taskRepository,
    projectRepository,
    projectMemberRepository,
    boardRepository,
    boardColumnRepository,
    labelRepository,
    userRepository,
    taskWatcherRepository,
    commentRepository,
    sprintRepository,
    notificationService,
    activityService,
    projectAccessService,
    config,
  }) {
    this.config = config;
    this.unitOfWork = unitOfWork;
    this.taskRepository = taskRepository;
    this.projectRepository = projectRepository;
    this.projectMemberRepository = projectMemberRepository;
    this.boardRepository = boardRepository;
    this.boardColumnRepository = boardColumnRepository;
    this.labelRepository = labelRepository;
    this.userRepository = userRepository;
    this.watchers = taskWatcherRepository;
    this.commentRepository = commentRepository;
    this.sprintRepository = sprintRepository;
    this.notifications = notificationService;
    this.activity = activityService;
    this.access = projectAccessService;
  }

  async list(user, projectId, { page, pageSize, assignee, ...filters }) {
    await this.access.assert(user, projectId, 'viewer');
    let assigneeId;
    if (assignee === 'me') assigneeId = user.id;
    else if (assignee === 'none') assigneeId = null;
    else assigneeId = assignee;

    // Mốc ngày theo múi giờ nghiệp vụ cho bộ lọc "quá hạn" / "sắp đến hạn".
    const now = new Date();
    const today = isoDateIn(now, this.config.TZ_BUSINESS);
    const soonUntil = isoDateIn(new Date(now.getTime() + DUE_SOON_DAYS * 86_400_000), this.config.TZ_BUSINESS);
    const { rows, count } = await this.taskRepository.search(
      projectId,
      { ...filters, assigneeId, today, soonUntil },
      { limit: pageSize, offset: (page - 1) * pageSize },
    );
    return { items: rows, meta: { page, pageSize, total: count } };
  }

  /** SRC-03: tìm nhanh toàn hệ thống — chỉ trong các dự án người dùng là thành viên (Quản trị viên: mọi dự án). */
  async quickSearch(user, { q, limit }) {
    const projectIds = user.isAdmin ? null : await this.projectMemberRepository.listProjectIds(user.id);
    if (projectIds && projectIds.length === 0) return [];
    return this.taskRepository.quickSearch(projectIds, q, limit);
  }

  /** DSH-01: việc chưa xong của tôi ở mọi dự án. */
  listMine(user) {
    return this.taskRepository.findOpenAssignedTo(user.id);
  }

  async getByKey(user, key) {
    const { task, role } = await this.#load(user, key, 'viewer');
    const watching = await this.watchers.isWatching(task.id, user.id);
    return { task, role, watching };
  }

  /** TSK-01..03: chỉ tiêu đề bắt buộc; mã công việc sinh tuần tự trong transaction có khóa dòng. */
  async create(user, projectId, data) {
    // Chỉ Quản trị viên / Quản lý dự án được tạo công việc.
    await this.access.assert(user, projectId, 'manager');
    const column = await this.#resolveColumn(projectId, data.columnId);
    if (data.assigneeId) await this.assertAssignable(projectId, data.assigneeId);
    if (data.labelIds?.length) await this.#assertLabels(projectId, data.labelIds);
    if (data.sprintId) await this.#assertOpenSprint(projectId, data.sprintId);
    const description = data.description ? sanitizeDoc(data.description) : null;

    const key = await this.unitOfWork.run(async (transaction) => {
      const project = await this.projectRepository.lockById(projectId, transaction);
      const number = project.taskCounter + 1;
      await project.update({ taskCounter: number }, { transaction });

      const maxPosition = await this.taskRepository.maxPosition(column.id, { transaction });
      const maxRank = await this.taskRepository.maxBacklogRank(projectId, { transaction });
      const task = await this.taskRepository.create(
        {
          projectId,
          number,
          key: `${project.key}-${number}`,
          type: data.type,
          title: data.title,
          description,
          descriptionText: toPlainText(description),
          columnId: column.id,
          assigneeId: data.assigneeId ?? null,
          creatorId: user.id,
          priority: data.priority,
          dueDate: data.dueDate ?? null,
          position: positionBetween(maxPosition, null),
          completedAt: column.isDone ? new Date() : null,
          sprintId: data.sprintId ?? null,
          backlogRank: positionBetween(maxRank, null),
        },
        { transaction },
      );
      if (data.labelIds?.length) await this.taskRepository.setLabels(task, data.labelIds, { transaction });
      // TSK-08: tự theo dõi — người tạo và người làm
      await this.watchers.addMany(task.id, [user.id, data.assigneeId], { transaction });
      return task.key;
    });

    const task = await this.taskRepository.findByKey(key);
    await this.activity.record(user, task, [{ action: 'created' }]);
    if (task.assigneeId) await this.#notifyAssigned(user, task);
    await this.#notifyMentions(user, task, description, null);
    return task;
  }

  /** TSK-05: sửa tại chỗ từng trường. */
  async update(user, key, data) {
    const { task, role } = await this.#load(user, key, 'member');
    // Thành viên chỉ được đổi trạng thái việc của mình; mọi chỉnh sửa khác do Quản lý dự án làm.
    if (role !== 'manager' && Object.keys(data).some((field) => !MEMBER_EDITABLE_FIELDS.has(field))) {
      throw AppError.forbidden('Chỉ Quản trị viên / Quản lý dự án được sửa công việc');
    }
    if (data.columnId && data.columnId !== task.columnId) this.assertCanMove(user, role, task);
    const before = { assigneeId: task.assigneeId, description: task.description, columnName: task.column?.name };
    const beforeSnapshot = ActivityService.snapshot(task);
    const changes = {};
    for (const field of SIMPLE_FIELDS) if (field in data) changes[field] = data[field];
    if ('description' in data) {
      changes.description = data.description ? sanitizeDoc(data.description) : null;
      changes.descriptionText = toPlainText(changes.description);
    }
    if (changes.assigneeId) await this.assertAssignable(task.projectId, changes.assigneeId);
    if (data.labelIds?.length) await this.#assertLabels(task.projectId, data.labelIds);

    let targetColumn = null;
    if (data.columnId && data.columnId !== task.columnId) {
      targetColumn = await this.#resolveColumn(task.projectId, data.columnId);
      this.assertCanChangeColumn(role, task.column, targetColumn);
      changes.columnId = targetColumn.id;
      changes.position = positionBetween(await this.taskRepository.maxPosition(targetColumn.id), null);
      changes.completedAt = this.#completedAt(task, targetColumn);
    }

    await this.unitOfWork.run(async (transaction) => {
      await task.update(changes, { transaction });
      if (data.labelIds) await this.taskRepository.setLabels(task, data.labelIds, { transaction });
      if (changes.assigneeId) await this.watchers.addMany(task.id, [changes.assigneeId], { transaction });
    });

    const saved = await this.taskRepository.findByKey(key);
    const entries = ActivityService.diff(beforeSnapshot, ActivityService.snapshot(saved));
    if ('description' in changes && JSON.stringify(changes.description) !== JSON.stringify(before.description)) {
      entries.push({ action: 'updated', field: 'description' });
    }
    await this.activity.record(user, saved, entries);
    if (changes.assigneeId && changes.assigneeId !== before.assigneeId) await this.#notifyAssigned(user, saved);
    if (targetColumn) await this.#notifyStatusChanged(user, saved, before.columnName, targetColumn.name);
    if ('description' in changes) await this.#notifyMentions(user, saved, changes.description, before.description);
    return saved;
  }

  /**
   * BRD-05: kéo thả. Client gửi cột đích và id công việc ngay trên (prevTaskId) / ngay dưới (nextTaskId)
   * vị trí thả; bỏ trống cả hai nghĩa là thả xuống cuối cột.
   */
  async move(user, key, { columnId, prevTaskId, nextTaskId }) {
    const { task, role } = await this.#load(user, key, 'member');
    this.assertCanMove(user, role, task);
    const column = await this.#resolveColumn(task.projectId, columnId);
    this.assertCanChangeColumn(role, task.column, column);
    if (prevTaskId === task.id || nextTaskId === task.id) throw AppError.badRequest('Vị trí thả không hợp lệ');
    const fromColumnName = task.column?.name;
    const columnChanged = column.id !== task.columnId;

    await this.unitOfWork.run(async (transaction) => {
      let position = await this.#positionFor(column.id, prevTaskId, nextTaskId, transaction);
      if (position === null) {
        await this.taskRepository.rebalanceColumn(column.id, GAP, { transaction });
        position = await this.#positionFor(column.id, prevTaskId, nextTaskId, transaction);
      }
      await task.update({ columnId: column.id, position, completedAt: this.#completedAt(task, column) }, { transaction });
    });

    const saved = await this.taskRepository.findByKey(key);
    if (columnChanged) {
      await this.activity.record(user, saved, [{ action: 'updated', field: 'status', from: fromColumnName, to: column.name }]);
      await this.#notifyStatusChanged(user, saved, fromColumnName, column.name);
    }
    return saved;
  }

  /**
   * Quy trình duyệt: Admin trả lại công việc kèm lý do. Chuyển việc về cột đích (mặc định cột liền trước,
   * ví dụ Chờ duyệt → Đang làm), tự tạo bình luận chứa lý do, ghi lịch sử, báo cho người làm.
   */
  async returnTask(user, key, { reason, columnId }) {
    const { task } = await this.#load(user, key, 'manager');
    const board = await this.boardRepository.findByProjectId(task.projectId);
    const columns = await this.boardColumnRepository.listByBoard(board.id);
    const index = columns.findIndex((c) => c.id === task.columnId);
    const target = columnId ? columns.find((c) => c.id === columnId) : columns[index - 1];
    if (!target) throw AppError.badRequest(columnId ? 'Cột không thuộc bảng của dự án' : 'Công việc đang ở cột đầu tiên, không thể trả lại');
    if (target.id === task.columnId) throw AppError.badRequest('Hãy chọn cột khác với cột hiện tại');
    if (target.isDone) throw AppError.badRequest('Không thể trả lại vào cột Hoàn thành');

    const fromName = task.column?.name;
    const body = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: `↩ Trả lại về “${target.name}”: `, marks: [{ type: 'bold' }] },
            { type: 'text', text: reason },
          ],
        },
      ],
    };
    await this.unitOfWork.run(async (transaction) => {
      const position = positionBetween(await this.taskRepository.maxPosition(target.id, { transaction }), null);
      await task.update({ columnId: target.id, position, completedAt: null }, { transaction });
      await this.commentRepository.create(
        { taskId: task.id, authorId: user.id, body: sanitizeDoc(body), bodyText: toPlainText(body) },
        { transaction },
      );
      await this.watchers.addMany(task.id, [user.id], { transaction });
    });

    const saved = await this.taskRepository.findByKey(key);
    await this.activity.record(user, saved, [{ action: 'returned', from: fromName, to: target.name }]);
    if (saved.assigneeId && saved.assigneeId !== user.id) {
      await this.notifications.notify({
        type: 'task_returned',
        recipientIds: [saved.assigneeId],
        actor: user,
        task: saved,
        data: { from: fromName, to: target.name, reason: reason.slice(0, 200) },
      });
    }
    return saved;
  }

  /** TSK-11: chỉ Quản trị viên / Quản lý dự án được xóa (xóa mềm). */
  async remove(user, key) {
    const { task } = await this.#load(user, key, 'manager');
    await task.destroy();
    await this.activity.record(user, task, [{ action: 'deleted', to: task.title }]);
  }

  /** RPT-05: dạng Lịch — việc có hạn trong khoảng ngày (tối đa ~2 tháng mỗi lần tải). */
  async calendar(user, projectId, { from, to }) {
    await this.access.assert(user, projectId, 'viewer');
    if (to < from) throw AppError.badRequest('Khoảng ngày không hợp lệ');
    const days = (new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86_400_000;
    if (days > MAX_CALENDAR_DAYS) throw AppError.badRequest(`Mỗi lần xem tối đa ${MAX_CALENDAR_DAYS} ngày`);
    const [tasks, withoutDueDate] = await Promise.all([
      this.taskRepository.listByDueRange(projectId, from, to),
      this.taskRepository.countWithoutDueDate(projectId),
    ]);
    return { tasks, withoutDueDate };
  }

  /** TSK-08: tự bấm Theo dõi / Bỏ theo dõi. Người xem cũng được theo dõi (BR-02a). */
  async setWatching(user, key, watching) {
    const { task } = await this.#load(user, key, 'viewer');
    if (watching) await this.watchers.addMany(task.id, [user.id]);
    else await this.watchers.remove(task.id, user.id);
    return { watching };
  }

  /** Dùng chung cho service khác (bình luận, việc con, tệp) cần nạp công việc kèm kiểm tra quyền. */
  loadForAccess(user, key, minRole) {
    return this.#load(user, key, minRole);
  }

  /**
   * Quyền di chuyển (kéo thả, đổi trạng thái, xếp vào sprint):
   * Quản trị viên / Quản lý dự án được di chuyển mọi công việc; Thành viên chỉ di chuyển việc
   * được giao cho mình. Người xem đã bị chặn từ trước (minRole = member).
   */
  canMove(user, role, task) {
    if (role === 'manager') return true;
    return role === 'member' && task.assigneeId === user.id;
  }

  /**
   * Bình luận / đính kèm tệp: Quản lý dự án với mọi việc, Thành viên chỉ với việc được giao cho mình.
   */
  async loadForParticipation(user, key) {
    const loaded = await this.#load(user, key, 'member');
    if (loaded.role !== 'manager' && loaded.task.assigneeId !== user.id) throw AppError.forbidden(NOT_YOUR_TASK);
    return loaded;
  }

  assertCanMove(user, role, task) {
    if (!this.canMove(user, role, task)) throw AppError.forbidden(CANNOT_MOVE);
  }

  /**
   * Quy trình duyệt: chỉ Quản trị viên / Quản lý dự án được đưa công việc vào (duyệt) hoặc ra khỏi
   * (mở lại) cột Hoàn thành. Thành viên làm xong thì chuyển sang Chờ duyệt.
   */
  assertCanChangeColumn(role, fromColumn, toColumn) {
    if (role === 'manager' || fromColumn?.id === toColumn.id) return;
    if (toColumn.isDone || fromColumn?.isDone) throw AppError.forbidden(ONLY_MANAGER_COMPLETES);
  }

  /** BR-02: chỉ giao cho Quản lý dự án / Thành viên, tài khoản chưa bị khóa. */
  async assertAssignable(projectId, userId) {
    const membership = await this.projectMemberRepository.findMembership(projectId, userId);
    if (!membership || !ASSIGNABLE_ROLES.has(membership.role)) {
      throw AppError.badRequest('Chỉ giao việc được cho Quản lý dự án hoặc Thành viên của dự án');
    }
    const assignee = await this.userRepository.findById(userId);
    if (!assignee || assignee.status === 'disabled') throw AppError.badRequest('Không thể giao việc cho tài khoản đã bị khóa');
  }

  /**
   * RTE-06: người mới được @nhắc (có trong `doc` nhưng không có trong `previousDoc`) và là thành viên dự án
   * → theo dõi công việc + nhận thông báo. Trả về danh sách id đã thông báo.
   */
  async notifyNewMentions(actor, task, doc, previousDoc, extra = {}) {
    const previous = extractMentionIds(previousDoc);
    const candidates = [...extractMentionIds(doc)].filter((id) => !previous.has(id));
    if (candidates.length === 0) return [];
    const members = await this.projectMemberRepository.findAll({ projectId: task.projectId, userId: candidates });
    const ids = members.map((m) => m.userId);
    await this.watchers.addMany(task.id, ids);
    await this.notifications.notify({ type: 'mentioned', recipientIds: ids, actor, task, data: extra });
    return ids;
  }

  // ---------- nội bộ ----------

  async #load(user, key, minRole) {
    const task = await this.taskRepository.findByKey(key);
    if (!task) throw AppError.notFound(`Không tìm thấy công việc ${key}`);
    const { role } = await this.access.assert(user, task.projectId, minRole);
    return { task, role };
  }

  async #resolveColumn(projectId, columnId) {
    const board = await this.boardRepository.findByProjectId(projectId);
    const columns = await this.boardColumnRepository.listByBoard(board.id);
    const column = columnId ? columns.find((c) => c.id === columnId) : columns[0];
    if (!column) throw AppError.badRequest('Cột không thuộc bảng của dự án');
    return column;
  }

  async #assertOpenSprint(projectId, sprintId) {
    const sprint = await this.sprintRepository.findById(sprintId);
    if (!sprint || sprint.projectId !== projectId || sprint.state === 'completed') {
      throw AppError.badRequest('Sprint không hợp lệ hoặc đã hoàn thành');
    }
  }

  async #assertLabels(projectId, labelIds) {
    const unique = [...new Set(labelIds)];
    const count = await this.labelRepository.countInProject(projectId, unique);
    if (count !== unique.length) throw AppError.badRequest('Nhãn không thuộc dự án');
  }

  /** BR-07: vào cột Hoàn thành thì ghi thời điểm hoàn thành, ra khỏi thì xóa. */
  #completedAt(task, column) {
    if (!column.isDone) return null;
    return task.completedAt ?? new Date();
  }

  /** Trả về null nếu khoảng cách quá nhỏ (cần đánh số lại cột). */
  async #positionFor(columnId, prevTaskId, nextTaskId, transaction) {
    const ids = [prevTaskId, nextTaskId].filter(Boolean);
    if (ids.length === 0) return positionBetween(await this.taskRepository.maxPosition(columnId, { transaction }), null);

    const rows = await this.taskRepository.findPositions(ids, { transaction });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const prev = prevTaskId ? byId.get(prevTaskId) : null;
    const next = nextTaskId ? byId.get(nextTaskId) : null;
    if ((prevTaskId && !prev) || (nextTaskId && !next) || [prev, next].some((n) => n && n.columnId !== columnId)) {
      throw AppError.badRequest('Vị trí thả không hợp lệ, vui lòng tải lại bảng');
    }
    if (needsRebalance(prev?.position, next?.position)) return null;
    return positionBetween(prev?.position, next?.position);
  }

  #notifyAssigned(actor, task) {
    return this.notifications.notify({ type: 'task_assigned', recipientIds: [task.assigneeId], actor, task });
  }

  async #notifyStatusChanged(actor, task, from, to) {
    const recipientIds = await this.watchers.listUserIds(task.id);
    await this.notifications.notify({ type: 'status_changed', recipientIds, actor, task, data: { from, to } });
  }

  #notifyMentions(actor, task, doc, previousDoc) {
    return this.notifyNewMentions(actor, task, doc, previousDoc, { context: 'description' });
  }
}

module.exports = TaskService;
