const AppError = require('../utils/AppError');

const DEFAULT_BOARD_NAME = 'Bảng công việc';
const DEFAULT_COLUMNS = [
  { name: 'Cần làm', isDone: false },
  { name: 'Đang làm', isDone: false },
  { name: 'Chờ duyệt', isDone: false },
  { name: 'Hoàn thành', isDone: true },
];

const withRole = (project, role) => {
  const { members, ...rest } = project.toJSON();
  return { ...rest, role: role ?? members?.[0]?.role ?? null };
};

class ProjectService {
  constructor({
    unitOfWork,
    projectRepository,
    projectMemberRepository,
    boardRepository,
    boardColumnRepository,
    taskRepository,
    subtaskRepository,
    userRepository,
    notificationService,
    projectAccessService,
  }) {
    this.unitOfWork = unitOfWork;
    this.projectRepository = projectRepository;
    this.projectMemberRepository = projectMemberRepository;
    this.boardRepository = boardRepository;
    this.boardColumnRepository = boardColumnRepository;
    this.taskRepository = taskRepository;
    this.subtaskRepository = subtaskRepository;
    this.userRepository = userRepository;
    this.notifications = notificationService;
    this.access = projectAccessService;
  }

  async listForUser(user, { archived }) {
    if (user.isAdmin) {
      const projects = await this.projectRepository.findAllProjects({ archived });
      return projects.map((p) => withRole(p, 'manager'));
    }
    const projects = await this.projectRepository.findForMember(user.id, { archived });
    return projects.map((p) => withRole(p));
  }

  async get(user, projectId) {
    const { project, role } = await this.access.assert(user, projectId, 'viewer');
    return withRole(project, role);
  }

  /** PRJ-01: tạo dự án + người tạo làm Quản lý + bảng mặc định 4 cột (BRD-01). */
  async create(user, data) {
    if (await this.projectRepository.findByKey(data.key, { paranoid: false })) {
      throw AppError.conflict(`Mã dự án ${data.key} đã được sử dụng`);
    }
    const project = await this.unitOfWork.run(async (transaction) => {
      const created = await this.projectRepository.create({ ...data, createdById: user.id }, { transaction });
      await this.projectMemberRepository.create({ projectId: created.id, userId: user.id, role: 'manager' }, { transaction });
      const board = await this.boardRepository.create({ projectId: created.id, name: DEFAULT_BOARD_NAME }, { transaction });
      await this.boardColumnRepository.bulkCreate(
        DEFAULT_COLUMNS.map((c, index) => ({ ...c, boardId: board.id, position: index })),
        { transaction },
      );
      return created;
    });
    return withRole(project, 'manager');
  }

  /** PRJ-02/03: sửa thông tin, lưu trữ/khôi phục. Mã dự án không đổi được. */
  async update(user, projectId, { archived, ...data }) {
    const { project } = await this.access.assert(user, projectId, 'manager', { allowArchived: archived === false });
    const changes = { ...data };
    if (archived !== undefined) changes.archivedAt = archived ? new Date() : null;
    await project.update(changes);
    return withRole(project, 'manager');
  }

  async remove(user, projectId) {
    if (!user.isAdmin) throw AppError.forbidden('Chỉ Quản trị viên được xóa dự án');
    const { project } = await this.access.assert(user, projectId, 'manager', { allowArchived: true });
    await project.destroy();
  }

  // ---------- Thành viên (PRJ-04) ----------

  async listMembers(user, projectId) {
    await this.access.assert(user, projectId, 'viewer');
    return this.projectMemberRepository.listMembers(projectId);
  }

  async addMember(user, projectId, { userId, role }) {
    const { project } = await this.access.assert(user, projectId, 'manager');
    const target = await this.userRepository.findById(userId);
    if (!target || target.status === 'disabled') throw AppError.badRequest('Người dùng không tồn tại hoặc đã bị khóa');
    if (await this.projectMemberRepository.findMembership(projectId, userId)) {
      throw AppError.conflict('Người này đã là thành viên dự án');
    }
    await this.projectMemberRepository.create({ projectId, userId, role });
    await this.notifications.notify({ type: 'added_to_project', recipientIds: [userId], actor: user, project });
    return this.#findMember(projectId, userId);
  }

  async updateMemberRole(user, projectId, userId, role) {
    await this.access.assert(user, projectId, 'manager');
    const membership = await this.#requireMembership(projectId, userId);

    await this.unitOfWork.run(async (transaction) => {
      if (membership.role === 'manager' && role !== 'manager') await this.#ensureAnotherManager(projectId, transaction);
      await membership.update({ role }, { transaction });
      if (role === 'viewer') await this.#unassignOpenWork(projectId, userId, transaction);
    });
    return this.#findMember(projectId, userId);
  }

  async removeMember(user, projectId, userId) {
    await this.access.assert(user, projectId, 'manager');
    const membership = await this.#requireMembership(projectId, userId);

    await this.unitOfWork.run(async (transaction) => {
      if (membership.role === 'manager') await this.#ensureAnotherManager(projectId, transaction);
      await membership.destroy({ transaction });
      await this.#unassignOpenWork(projectId, userId, transaction);
    });
  }

  async #unassignOpenWork(projectId, userId, transaction) {
    await this.taskRepository.unassignOpenTasks(projectId, userId, { transaction });
    await this.subtaskRepository.unassignOpenInProject(projectId, userId, { transaction });
  }

  async #requireMembership(projectId, userId) {
    const membership = await this.projectMemberRepository.findMembership(projectId, userId);
    if (!membership) throw AppError.notFound('Người này không phải thành viên dự án');
    return membership;
  }

  async #ensureAnotherManager(projectId, transaction) {
    const managers = await this.projectMemberRepository.countManagers(projectId, { transaction });
    if (managers <= 1) throw AppError.badRequest('Dự án phải luôn có ít nhất 1 Quản lý dự án');
  }

  async #findMember(projectId, userId) {
    const members = await this.projectMemberRepository.listMembers(projectId);
    return members.find((m) => m.userId === userId);
  }
}

module.exports = ProjectService;
