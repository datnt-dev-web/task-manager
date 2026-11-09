const { z, uuid, text, params, atLeastOne } = require('./common');

const date = z.iso.date({ error: 'Ngày phải ở dạng YYYY-MM-DD' });
const sprintParams = params({ sprintId: uuid });

module.exports = {
  byProject: { params: params({ projectId: uuid }) },
  create: {
    params: params({ projectId: uuid }),
    body: z.object({
      name: text('Tên sprint', 1, 100).optional(),
      goal: z.string().trim().max(2000).nullable().optional(),
      startDate: date.nullable().optional(),
      endDate: date.nullable().optional(),
    }),
  },
  update: {
    params: sprintParams,
    body: atLeastOne(
      z.object({
        name: text('Tên sprint', 1, 100).optional(),
        goal: z.string().trim().max(2000).nullable().optional(),
        startDate: date.nullable().optional(),
        endDate: date.nullable().optional(),
      }),
    ),
  },
  remove: { params: sprintParams },
  start: {
    params: sprintParams,
    body: z.object({ startDate: date.optional(), endDate: date.optional() }),
  },
  complete: {
    params: sprintParams,
    body: z.object({ moveToSprintId: uuid.nullable().optional() }),
  },
};
