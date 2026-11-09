class BoardController {
  constructor({ boardService }) {
    this.boardService = boardService;
  }

  getByProject = async (req, res) => {
    const { board, columns, tasks, role, project, activeSprint } = await this.boardService.getBoard(
      req.user,
      req.valid.params.projectId,
    );
    res.json({ data: { ...board.toJSON(), project, columns, tasks, activeSprint }, meta: { role } });
  };

  rename = async (req, res) => {
    res.json({ data: await this.boardService.rename(req.user, req.valid.params.boardId, req.valid.body.name) });
  };

  addColumn = async (req, res) => {
    res.status(201).json({ data: await this.boardService.addColumn(req.user, req.valid.params.boardId, req.valid.body) });
  };

  updateColumn = async (req, res) => {
    res.json({ data: await this.boardService.updateColumn(req.user, req.valid.params.columnId, req.valid.body) });
  };

  reorderColumns = async (req, res) => {
    const columns = await this.boardService.reorderColumns(req.user, req.valid.params.boardId, req.valid.body.columnIds);
    res.json({ data: columns });
  };

  deleteColumn = async (req, res) => {
    await this.boardService.deleteColumn(req.user, req.valid.params.columnId, req.valid.query.moveTo);
    res.status(204).end();
  };
}

module.exports = BoardController;
