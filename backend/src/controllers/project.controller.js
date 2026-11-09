class ProjectController {
  constructor({ projectService }) {
    this.projectService = projectService;
  }

  list = async (req, res) => {
    res.json({ data: await this.projectService.listForUser(req.user, req.valid.query) });
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
