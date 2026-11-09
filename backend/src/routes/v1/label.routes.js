const { Router } = require('express');
const validate = require('../../middlewares/validate');
const v = require('../../validators/label.validator');

module.exports = ({ controllers }) => {
  const router = Router();
  const c = controllers.label;

  router.patch('/:labelId', validate(v.update), c.update);
  router.delete('/:labelId', validate(v.remove), c.remove);

  return router;
};
