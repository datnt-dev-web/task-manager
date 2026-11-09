const { Router } = require('express');
const validate = require('../../middlewares/validate');
const v = require('../../validators/board.validator');

module.exports = ({ controllers }) => {
  const boards = Router();
  const columns = Router();
  const c = controllers.board;

  boards.patch('/:boardId', validate(v.rename), c.rename);
  boards.post('/:boardId/columns', validate(v.addColumn), c.addColumn);
  boards.put('/:boardId/columns/order', validate(v.reorderColumns), c.reorderColumns);

  columns.patch('/:columnId', validate(v.updateColumn), c.updateColumn);
  columns.delete('/:columnId', validate(v.deleteColumn), c.deleteColumn);

  return { boards, columns };
};
