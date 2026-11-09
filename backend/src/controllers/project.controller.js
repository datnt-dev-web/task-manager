class ProjectController {
  constructor({ projectService }) {
    this.projectService = projectService;
  }

  /** Có `page` → trả về một trang (kèm meta); không có → toàn bộ (thanh bên, bộ chọn dự án). */
  list = async (req, res) => {
    const query = req.valid.query;
    if (query.page === undefined) {
      res.json({ data: await this.projectService.listForUser(req.user, query) });
      return;
    }
    const { items, meta } = await this.projectService.searchForUser(req.user, { ...query, pageSize: query.pageSize ?? 12 });
    res.json({ data: items, meta });
  };

  get = async (req, res) => {
    res.json({ data: await this.projectService.get(req.user, req.valid.params.projectId) });
  };

  create = async (req, res) => {
    res.status(201).json({ data: await this.projectService.create(req.user, req.valid.body) });
  };

  update = async (req, res) => {
    res.json({ data: await this.projectService.update(req.user, req.valid.params.projectId, req.valid.body) });
  };

  remove = async (req, res) => {
    await this.projectService.remove(req.user, req.valid.params.projectId);
    res.status(204).end();
  };

  overview = async (req, res) => {
    res.json({ data: await this.projectService.overview(req.user, req.valid.params.projectId) });
  };

  listMembers = async (req, res) => {
    res.json({ data: await this.projectService.listMembers(req.user, req.valid.params.projectId) });
  };

  addMember = async (req, res) => {
    const member = await this.projectService.addMember(req.user, req.valid.params.projectId, req.valid.body);
    res.status(201).json({ data: member });
  };

  updateMember = async (req, res) => {
    const { projectId, userId } = req.valid.params;
    res.json({ data: await this.projectService.updateMemberRole(req.user, projectId, userId, req.valid.body.role) });
  };

  removeMember = async (req, res) => {
    const { projectId, userId } = req.valid.params;
    await this.projectService.removeMember(req.user, projectId, userId);
    res.status(204).end();
  };
}

module.exports = ProjectController;
