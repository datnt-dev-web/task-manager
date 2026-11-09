class LabelController {
  constructor({ labelService }) {
    this.labelService = labelService;
  }

  list = async (req, res) => {
    res.json({ data: await this.labelService.list(req.user, req.valid.params.projectId) });
  };

  create = async (req, res) => {
    res.status(201).json({ data: await this.labelService.create(req.user, req.valid.params.projectId, req.valid.body) });
  };

  update = async (req, res) => {
    res.json({ data: await this.labelService.update(req.user, req.valid.params.labelId, req.valid.body) });
  };

  remove = async (req, res) => {
    await this.labelService.remove(req.user, req.valid.params.labelId);
    res.status(204).end();
  };
}

module.exports = LabelController;
