const { z, uuid, text, params, atLeastOne } = require('./common');
const { byKey } = require('./task.validator');

const date = z.iso.date({ error: 'Ngày phải ở dạng YYYY-MM-DD' });

module.exports = {
  create: {
    params: byKey.params,
    body: z.object({
      title: text('Việc con', 1, 255),
      assigneeId: uuid.nullable().optional(),
      dueDate: date.nullable().optional(),
    }),
  },
  update: {
    params: params({ subtaskId: uuid }),
    body: atLeastOne(
      z.object({
        title: text('Việc con', 1, 255).optional(),
        isDone: z.boolean().optional(),
        assigneeId: uuid.nullable().optional(),
        dueDate: date.nullable().optional(),
      }),
    ),
  },
  remove: { params: params({ subtaskId: uuid }) },
};
