class SubtaskController {
  constructor({ subtaskService }) {
    this.subtaskService = subtaskService;
  }

  create = async (req, res) => {
    res.status(201).json({ data: await this.subtaskService.create(req.user, req.valid.params.key, req.valid.body) });
  };

  update = async (req, res) => {
    res.json({ data: await this.subtaskService.update(req.user, req.valid.params.subtaskId, req.valid.body) });
  };

  remove = async (req, res) => {
    await this.subtaskService.remove(req.user, req.valid.params.subtaskId);
    res.status(204).end();
  };
}

module.exports = SubtaskController;
