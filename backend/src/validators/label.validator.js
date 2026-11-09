const { z, uuid, text, hexColor, params, atLeastOne } = require('./common');

module.exports = {
  list: { params: params({ projectId: uuid }) },
  create: {
    params: params({ projectId: uuid }),
    body: z.object({ name: text('Tên nhãn', 1, 50), color: hexColor }),
  },
  update: {
    params: params({ labelId: uuid }),
    body: atLeastOne(z.object({ name: text('Tên nhãn', 1, 50).optional(), color: hexColor.optional() })),
  },
  remove: { params: params({ labelId: uuid }) },
};
