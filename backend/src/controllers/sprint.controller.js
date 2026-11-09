class SprintController {
  constructor({ sprintService }) {
    this.sprintService = sprintService;
  }

  backlog = async (req, res) => {
    const { sprints, backlog, role } = await this.sprintService.getBacklog(req.user, req.valid.params.projectId);
    res.json({ data: { sprints, backlog }, meta: { role } });
  };

  listCompleted = async (req, res) => {
    res.json({ data: await this.sprintService.listCompleted(req.user, req.valid.params.projectId) });
  };

  create = async (req, res) => {
    res.status(201).json({ data: await this.sprintService.create(req.user, req.valid.params.projectId, req.valid.body) });
  };

  update = async (req, res) => {
    res.json({ data: await this.sprintService.update(req.user, req.valid.params.sprintId, req.valid.body) });
  };

  remove = async (req, res) => {
    await this.sprintService.remove(req.user, req.valid.params.sprintId);
    res.status(204).end();
  };

  start = async (req, res) => {
    res.json({ data: await this.sprintService.start(req.user, req.valid.params.sprintId, req.valid.body) });
  };

  complete = async (req, res) => {
    res.json({ data: await this.sprintService.complete(req.user, req.valid.params.sprintId, req.valid.body) });
  };

  plan = async (req, res) => {
    res.json({ data: await this.sprintService.plan(req.user, req.valid.params.key, req.valid.body) });
  };
}

module.exports = SprintController;
