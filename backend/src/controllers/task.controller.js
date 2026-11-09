class TaskController {
  constructor({ taskService, activityService }) {
    this.taskService = taskService;
    this.activityService = activityService;
  }

  calendar = async (req, res) => {
    const { tasks, withoutDueDate } = await this.taskService.calendar(req.user, req.valid.params.projectId, req.valid.query);
    res.json({ data: tasks, meta: { withoutDueDate } });
  };

  activity = async (req, res) => {
    res.json({ data: await this.activityService.list(req.user, req.valid.params.key) });
  };

  list = async (req, res) => {
    const { items, meta } = await this.taskService.list(req.user, req.valid.params.projectId, req.valid.query);
    res.json({ data: items, meta });
  };

  listMine = async (req, res) => {
    res.json({ data: await this.taskService.listMine(req.user) });
  };

  get = async (req, res) => {
    const { task, role, watching } = await this.taskService.getByKey(req.user, req.valid.params.key);
    res.json({ data: task, meta: { role, watching } });
  };

  /** Middleware: chặn Người xem / người ngoài trước khi multer đọc tệp. */
  assertCanUpload = async (req, _res, next) => {
    await this.taskService.loadForParticipation(req.user, req.valid.params.key);
    next();
  };

  watch = async (req, res) => {
    res.json({ data: await this.taskService.setWatching(req.user, req.valid.params.key, true) });
  };

  unwatch = async (req, res) => {
    res.json({ data: await this.taskService.setWatching(req.user, req.valid.params.key, false) });
  };

  create = async (req, res) => {
    res.status(201).json({ data: await this.taskService.create(req.user, req.valid.params.projectId, req.valid.body) });
  };

  update = async (req, res) => {
    res.json({ data: await this.taskService.update(req.user, req.valid.params.key, req.valid.body) });
  };

  move = async (req, res) => {
    res.json({ data: await this.taskService.move(req.user, req.valid.params.key, req.valid.body) });
  };

  remove = async (req, res) => {
    await this.taskService.remove(req.user, req.valid.params.key);
    res.status(204).end();
  };
}

module.exports = TaskController;
