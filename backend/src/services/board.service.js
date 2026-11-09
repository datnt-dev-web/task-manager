const AppError = require('../utils/AppError');

const MIN_COLUMNS = 2;
const MAX_COLUMNS = 10;

const sameName = (a, b) => a.trim().toLocaleLowerCase('vi') === b.trim().toLocaleLowerCase('vi');

class BoardService {
  constructor({ unitOfWork, boardRepository, boardColumnRepository, taskRepository, sprintRepository, projectAccessService }) {
    this.sprintRepository = sprintRepository;
    this.unitOfWork = unitOfWork;
    this.boardRepository = boardRepository;
    this.boardColumnRepository = boardColumnRepository;
    this.taskRepository = taskRepository;
    this.access = projectAccessService;
  }

  /** Toàn bộ dữ liệu để vẽ bảng: bảng, cột (đã sắp xếp), công việc, vai trò người xem. */
  async getBoard(user, projectId) {
    const { project, role } = await this.access.assert(user, projectId, 'viewer');
    const board = await this.boardRepository.findByProjectId(projectId);
    if (!board) throw AppError.notFound('Dự án chưa có bảng');
    const activeSprint = await this.sprintRepository.findActive(projectId);
    const [columns, tasks] = await Promise.all([
      this.boardColumnRepository.listByBoard(board.id),
      this.taskRepository.listForBoard(projectId, { sprintId: activeSprint?.id }),
    ]);
    return { board, columns, tasks, role, project, activeSprint };
  }

  /** BRD-02: đổi tên bảng. */
  async rename(user, boardId, name) {
    const board = await this.#loadBoard(user, boardId);
    return board.update({ name });
  }

  /** BRD-03: thêm cột vào cuối, trước cột Hoàn thành nếu cột Hoàn thành đang ở cuối. */
  async addColumn(user, boardId, { name }) {
    const board = await this.#loadBoard(user, boardId);
    const columns = await this.boardColumnRepository.listByBoard(board.id);
    if (columns.length >= MAX_COLUMNS) throw AppError.badRequest(`Bảng chỉ có tối đa ${MAX_COLUMNS} cột`);
    this.#assertUniqueName(columns, name);

    return this.unitOfWork.run(async (transaction) => {
      const last = columns[columns.length - 1];
      let position = columns.length;
      if (last?.isDone) {
        position = last.position;
        await last.update({ position: last.position + 1 }, { transaction });
      }
      return this.boardColumnRepository.create({ boardId: board.id, name, position, isDone: false }, { transaction });
    });
  }

  /** BRD-03/04: đổi tên cột, đặt làm cột Hoàn thành (luôn đúng 1 cột Hoàn thành). */
  async updateColumn(user, columnId, { name, isDone }) {
    const column = await this.#loadColumn(user, columnId);
    const columns = await this.boardColumnRepository.listByBoard(column.boardId);

    if (name !== undefined) this.#assertUniqueName(columns.filter((c) => c.id !== column.id), name);
    if (isDone === false && column.isDone) {
      throw AppError.badRequest('Bảng phải có 1 cột Hoàn thành. Hãy chọn cột khác làm cột Hoàn thành.');
    }

    await this.unitOfWork.run(async (transaction) => {
      if (isDone === true && !column.isDone) {
        const previousDone = columns.find((c) => c.isDone);
        if (previousDone) {
          await previousDone.update({ isDone: false }, { transaction });
          await this.taskRepository.clearCompletedInColumn(previousDone.id, { transaction });
        }
        await this.taskRepository.markCompletedInColumn(column.id, { transaction });
      }
      await column.update({ ...(name !== undefined && { name }), ...(isDone === true && { isDone: true }) }, { transaction });
    });
    return column;
  }

  /** BRD-03: sắp xếp lại cột. `columnIds` phải chứa đủ mọi cột của bảng. */
  async reorderColumns(user, boardId, columnIds) {
    const board = await this.#loadBoard(user, boardId);
    const columns = await this.boardColumnRepository.listByBoard(board.id);
    const current = new Set(columns.map((c) => c.id));
    if (columnIds.length !== columns.length || !columnIds.every((id) => current.has(id))) {
      throw AppError.badRequest('Danh sách cột không khớp với bảng hiện tại');
    }

    await this.unitOfWork.run(async (transaction) => {
      await Promise.all(
        columnIds.map((id, index) => this.boardColumnRepository.update({ id }, { position: index }, { transaction })),
      );
    });
    return this.boardColumnRepository.listByBoard(board.id);
  }

  /** BRD-03: xóa cột; còn công việc thì phải chọn cột nhận. */
  async deleteColumn(user, columnId, moveToColumnId) {
    const column = await this.#loadColumn(user, columnId);
    const columns = await this.boardColumnRepository.listByBoard(column.boardId);
    if (columns.length <= MIN_COLUMNS) throw AppError.badRequest(`Bảng phải có ít nhất ${MIN_COLUMNS} cột`);
    if (column.isDone) throw AppError.badRequest('Không thể xóa cột Hoàn thành. Hãy đặt cột khác làm cột Hoàn thành trước.');

    const taskCount = await this.taskRepository.countInColumn(column.id);
    const target = moveToColumnId ? columns.find((c) => c.id === moveToColumnId) : null;
    if (taskCount > 0 && !target) throw AppError.badRequest('Cột còn công việc, hãy chọn cột để chuyển các công việc sang');
    if (target?.id === column.id) throw AppError.badRequest('Cột nhận phải khác cột bị xóa');

    await this.unitOfWork.run(async (transaction) => {
      if (target) {
        await this.taskRepository.moveAllToColumn(column.id, target.id, { transaction });
        if (target.isDone) await this.taskRepository.markCompletedInColumn(target.id, { transaction });
      }
      await column.destroy({ transaction });
      const remaining = columns.filter((c) => c.id !== column.id);
      await Promise.all(
        remaining.map((c, index) => this.boardColumnRepository.update({ id: c.id }, { position: index }, { transaction })),
      );
    });
  }

  #assertUniqueName(columns, name) {
    if (columns.some((c) => sameName(c.name, name))) throw AppError.conflict(`Đã có cột tên "${name.trim()}"`);
  }

  async #loadBoard(user, boardId) {
    const board = await this.boardRepository.findById(boardId);
    if (!board) throw AppError.notFound('Không tìm thấy bảng');
    await this.access.assert(user, board.projectId, 'manager');
    return board;
  }

  async #loadColumn(user, columnId) {
    const column = await this.boardColumnRepository.findWithBoard(columnId);
    if (!column) throw AppError.notFound('Không tìm thấy cột');
    await this.access.assert(user, column.board.projectId, 'manager');
    return column;
  }
}

module.exports = BoardService;
