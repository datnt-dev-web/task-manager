const { Router } = require('express');
const validate = require('../../middlewares/validate');
const requireAdmin = require('../../middlewares/requireAdmin');
const v = require('../../validators/user.validator');

module.exports = ({ controllers }) => {
  const router = Router();
  const c = controllers.user;

  router.patch('/me', validate(v.updateMe), c.updateMe);
  router.get('/', validate(v.list), c.list);
  router.post('/', requireAdmin, validate(v.invite), c.invite);
  router.patch('/:userId', requireAdmin, validate(v.adminUpdate), c.adminUpdate);

  return router;
};
