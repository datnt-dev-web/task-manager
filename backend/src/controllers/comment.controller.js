class CommentController {
  constructor({ commentService }) {
    this.commentService = commentService;
  }

  list = async (req, res) => {
    res.json({ data: await this.commentService.list(req.user, req.valid.params.key, req.valid.query) });
  };

  create = async (req, res) => {
    res.status(201).json({ data: await this.commentService.create(req.user, req.valid.params.key, req.valid.body.body) });
  };

  update = async (req, res) => {
    res.json({ data: await this.commentService.update(req.user, req.valid.params.commentId, req.valid.body.body) });
  };

  remove = async (req, res) => {
    await this.commentService.remove(req.user, req.valid.params.commentId);
    res.status(204).end();
  };
}

module.exports = CommentController;
