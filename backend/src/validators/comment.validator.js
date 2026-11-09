const { z, uuid, richDoc, params } = require('./common');
const { byKey } = require('./task.validator');

module.exports = {
  list: { params: byKey.params, query: z.object({ order: z.enum(['asc', 'desc']).default('asc') }) },
  create: { params: byKey.params, body: z.object({ body: richDoc }) },
  update: { params: params({ commentId: uuid }), body: z.object({ body: richDoc }) },
  remove: { params: params({ commentId: uuid }) },
};
