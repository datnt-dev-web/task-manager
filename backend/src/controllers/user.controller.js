class UserController {
  constructor({ userService }) {
    this.userService = userService;
  }

  updateMe = async (req, res) => {
    res.json({ data: await this.userService.updateProfile(req.user, req.valid.body) });
  };

  list = async (req, res) => {
    const { items, meta } = await this.userService.list(req.user, req.valid.query);
    res.json({ data: items, meta });
  };

  invite = async (req, res) => {
    res.status(201).json({ data: await this.userService.invite(req.user, req.valid.body.emails) });
  };

  adminUpdate = async (req, res) => {
    res.json({ data: await this.userService.updateByAdmin(req.user, req.valid.params.userId, req.valid.body) });
  };
}

module.exports = UserController;
