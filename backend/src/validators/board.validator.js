const { z, uuid, text, params, atLeastOne } = require('./common');

module.exports = {
  byProject: { params: params({ projectId: uuid }) },
  rename: { params: params({ boardId: uuid }), body: z.object({ name: text('Tên bảng', 1, 100) }) },
  addColumn: { params: params({ boardId: uuid }), body: z.object({ name: text('Tên cột', 1, 30) }) },
  updateColumn: {
    params: params({ columnId: uuid }),
    body: atLeastOne(z.object({ name: text('Tên cột', 1, 30).optional(), isDone: z.boolean().optional() })),
  },
  reorderColumns: {
    params: params({ boardId: uuid }),
    body: z.object({ columnIds: z.array(uuid).min(2).max(10) }),
  },
  deleteColumn: {
    params: params({ columnId: uuid }),
    query: z.object({ moveTo: uuid.optional() }),
  },
};
