const { Op, QueryTypes, literal } = require('sequelize');
const BaseRepository = require('./base.repository');
const { USER_BRIEF_ATTRIBUTES, LABEL_ATTRIBUTES } = require('./attributes');

const SORT_FIELDS = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  dueDate: 'dueDate',
  priority: 'priority',
  number: 'number',
  title: 'title',
};

class TaskRepository extends BaseRepository {
  constructor(model, { User, Label, BoardColumn, Project, Subtask, Sprint }) {
    super(model);
    this.Subtask = Subtask;
    this.Sprint = Sprint;
    this.User = User;
    this.Label = Label;
    this.BoardColumn = BoardColumn;
    this.Project = Project;
  }

  /** Số việc con / đã xong để hiện "2/5" trên thẻ (BRD-06). */
  subtaskCountAttributes() {
    return [
      [literal('(SELECT COUNT(*) FROM subtasks s WHERE s.task_id = "Task"."id")::int'), 'subtaskCount'],
      [literal('(SELECT COUNT(*) FROM subtasks s WHERE s.task_id = "Task"."id" AND s.is_done)::int'), 'subtaskDoneCount'],
    ];
  }

  /** Liên kết dùng cho thẻ công việc (bảng, danh sách). */
  cardIncludes() {
    return [
      { model: this.User, as: 'assignee', attributes: USER_BRIEF_ATTRIBUTES },
      { model: this.Label, as: 'labels', attributes: LABEL_ATTRIBUTES, through: { attributes: [] } },
    ];
  }

  findByKey(key, options = {}) {
    return this.model.findOne({
      where: { key },
      include: [
        ...this.cardIncludes(),
        { model: this.User, as: 'creator', attributes: USER_BRIEF_ATTRIBUTES },
        { model: this.BoardColumn, as: 'column', attributes: ['id', 'name', 'isDone'] },
        { model: this.Project, as: 'project', attributes: ['id', 'key', 'name', 'archivedAt'] },
        { model: this.Sprint, as: 'sprint', attributes: ['id', 'name', 'state'] },
        {
          model: this.Subtask,
          as: 'subtasks',
          include: [{ model: this.User, as: 'assignee', attributes: USER_BRIEF_ATTRIBUTES }],
        },
      ],
      order: [[{ model: this.Subtask, as: 'subtasks' }, 'position', 'ASC']],
      ...options,
    });
  }

  /** Công việc trên bảng (không lấy mô tả để nhẹ). Có sprint đang chạy thì chỉ lấy việc của sprint đó. */
  listForBoard(projectId, { sprintId } = {}) {
    return this.model.findAll({
      where: { projectId, ...(sprintId ? { sprintId } : {}) },
      attributes: { exclude: ['description', 'descriptionText'], include: this.subtaskCountAttributes() },
      include: this.cardIncludes(),
      order: [['position', 'ASC']],
    });
  }

  search(projectId, filters, { limit, offset }) {
    const where = { projectId };
    if (filters.assigneeId === null) where.assigneeId = null;
    else if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.columnIds?.length) where.columnId = { [Op.in]: filters.columnIds };
    if (filters.priorities?.length) where.priority = { [Op.in]: filters.priorities };
    if (filters.type) where.type = filters.type;
    if (filters.dueFrom || filters.dueTo) {
      where.dueDate = {
        ...(filters.dueFrom ? { [Op.gte]: filters.dueFrom } : {}),
        ...(filters.dueTo ? { [Op.lte]: filters.dueTo } : {}),
      };
    }
    if (filters.q) {
      const q = filters.q.trim();
      where[Op.or] = [
        { key: { [Op.iLike]: q } },
        { title: { [Op.iLike]: `%${q}%` } },
        { descriptionText: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const include = this.cardIncludes();
    if (filters.labelId) {
      // Lọc theo nhãn nhưng vẫn trả đủ nhãn của công việc.
      where.id = {
        [Op.in]: literal(
          `(SELECT task_id FROM task_labels WHERE label_id = ${this.model.sequelize.escape(filters.labelId)})`,
        ),
      };
    }

    const sortField = SORT_FIELDS[filters.sort] || 'createdAt';
    return this.model.findAndCountAll({
      where,
      attributes: { exclude: ['description', 'descriptionText'] },
      include,
      distinct: true,
      limit,
      offset,
      order: [
        [sortField, `${filters.order === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`],
        ['number', 'DESC'],
      ],
    });
  }

  /** Việc chưa xong được giao cho người dùng, trong các dự án chưa lưu trữ. */
  findOpenAssignedTo(userId) {
    return this.model.findAll({
      where: { assigneeId: userId, completedAt: null },
      attributes: { exclude: ['description', 'descriptionText'] },
      include: [
        ...this.cardIncludes(),
        { model: this.Project, as: 'project', attributes: ['id', 'key', 'name', 'color', 'icon'], where: { archivedAt: null } },
        { model: this.BoardColumn, as: 'column', attributes: ['id', 'name', 'isDone'] },
      ],
      order: [
        ['dueDate', 'ASC NULLS LAST'],
        ['priority', 'ASC'],
      ],
    });
  }

  /**
   * Màn hình Backlog: việc thuộc các sprint chưa hoàn thành + việc chưa vào sprint nào và chưa xong.
   * Sắp theo backlogRank (thứ tự ưu tiên).
   */
  listForPlanning(projectId, openSprintIds) {
    return this.model.findAll({
      where: {
        projectId,
        [Op.or]: [
          ...(openSprintIds.length ? [{ sprintId: { [Op.in]: openSprintIds } }] : []),
          { sprintId: null, completedAt: null },
        ],
      },
      attributes: { exclude: ['description', 'descriptionText'], include: this.subtaskCountAttributes() },
      include: this.cardIncludes(),
      order: [['backlogRank', 'ASC']],
    });
  }

  /** Lịch: việc có hạn trong khoảng ngày. */
  listByDueRange(projectId, from, to, { limit = 1000 } = {}) {
    return this.model.findAll({
      where: { projectId, dueDate: { [Op.between]: [from, to] } },
      attributes: { exclude: ['description', 'descriptionText'] },
      include: this.cardIncludes(),
      order: [
        ['dueDate', 'ASC'],
        ['priority', 'ASC'],
      ],
      limit,
    });
  }

  countWithoutDueDate(projectId) {
    return this.count({ projectId, dueDate: null, completedAt: null });
  }

  async maxBacklogRank(projectId, options = {}) {
    return (await this.model.max('backlogRank', { where: { projectId }, ...options })) ?? null;
  }

  findBacklogRanks(ids, options = {}) {
    return this.model.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'sprintId', 'backlogRank'], ...options });
  }

  /** Đánh số lại thứ tự ưu tiên trong một danh sách (backlog hoặc 1 sprint). */
  async rebalanceBacklog(projectId, sprintId, gap, options = {}) {
    await this.model.sequelize.query(
      `UPDATE tasks t SET backlog_rank = s.rn * :gap
       FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY backlog_rank) AS rn FROM tasks
             WHERE project_id = :projectId AND sprint_id ${sprintId ? '= :sprintId' : 'IS NULL'}) s
       WHERE t.id = s.id`,
      { replacements: { projectId, sprintId, gap }, ...options },
    );
  }

  /** SPR-05: chuyển việc chưa xong của sprint sang sprint khác hoặc về backlog. */
  moveIncomplete(fromSprintId, toSprintId, options = {}) {
    return this.update({ sprintId: fromSprintId, completedAt: null }, { sprintId: toSprintId }, options);
  }

  countDoneBySprint(sprintId, options = {}) {
    return this.count({ sprintId, completedAt: { [Op.ne]: null } }, options);
  }

  countBySprint(sprintId, options = {}) {
    return this.count({ sprintId }, options);
  }

  /** Việc chưa xong có người làm, đến hạn đúng ngày `isoDate`, dự án chưa lưu trữ (nhắc hạn, BR-08). */
  /**
   * DSH-02: số liệu tổng quan dự án, gom ngay trong DB (không tải từng công việc).
   * `today` là ngày theo múi giờ nghiệp vụ (YYYY-MM-DD) để tính quá hạn.
   */
  async overviewCounts(projectId, today) {
    const select = (sql) =>
      this.model.sequelize.query(sql, { replacements: { projectId, today }, type: QueryTypes.SELECT });
    const [byColumn, byAssignee] = await Promise.all([
      select(`SELECT column_id AS "columnId", COUNT(*)::int AS count
                FROM tasks WHERE project_id = :projectId AND deleted_at IS NULL
               GROUP BY column_id`),
      select(`SELECT assignee_id AS "assigneeId",
                     COUNT(*) FILTER (WHERE completed_at IS NULL)::int AS open,
                     COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::int AS done,
                     COUNT(*) FILTER (WHERE completed_at IS NULL AND due_date < :today)::int AS overdue
                FROM tasks WHERE project_id = :projectId AND deleted_at IS NULL
               GROUP BY assignee_id`),
    ]);
    return { byColumn, byAssignee };
  }

  findOpenDueOn(isoDate) {
    return this.model.findAll({
      where: { dueDate: isoDate, completedAt: null, assigneeId: { [Op.ne]: null } },
      attributes: ['id', 'key', 'title', 'projectId', 'assigneeId', 'dueDate'],
      include: [{ model: this.Project, as: 'project', attributes: ['id', 'name'], where: { archivedAt: null } }],
    });
  }

  /** Vị trí của các công việc liền kề trong cột (dùng khi kéo thả). */
  findPositions(ids, options = {}) {
    return this.model.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'columnId', 'position'], ...options });
  }

  async maxPosition(columnId, options = {}) {
    const max = await this.model.max('position', { where: { columnId }, ...options });
    return max ?? null;
  }

  /** Đánh số lại vị trí cả cột khi khoảng cách giữa các thẻ quá nhỏ. */
  async rebalanceColumn(columnId, gap, options = {}) {
    await this.model.sequelize.query(
      `UPDATE tasks t SET position = s.rn * :gap
       FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY position) AS rn FROM tasks WHERE column_id = :columnId) s
       WHERE t.id = s.id`,
      { replacements: { columnId, gap }, ...options },
    );
  }

  moveAllToColumn(fromColumnId, toColumnId, options = {}) {
    return this.update({ columnId: fromColumnId }, { columnId: toColumnId }, { paranoid: false, ...options });
  }

  /** BR-02: bỏ giao các việc chưa xong khi người dùng rời dự án hoặc thành Người xem. */
  unassignOpenTasks(projectId, userId, options = {}) {
    return this.update({ projectId, assigneeId: userId, completedAt: null }, { assigneeId: null }, options);
  }

  markCompletedInColumn(columnId, options = {}) {
    return this.update({ columnId, completedAt: null }, { completedAt: new Date() }, options);
  }

  clearCompletedInColumn(columnId, options = {}) {
    return this.update({ columnId }, { completedAt: null }, options);
  }

  setLabels(task, labelIds, options = {}) {
    return task.setLabels(labelIds, options);
  }

  countInColumn(columnId, options = {}) {
    return this.count({ columnId }, options);
  }
}

module.exports = TaskRepository;
