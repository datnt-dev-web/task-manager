const { z, uuid } = require('./common');

module.exports = {
  list: {
    query: z.object({
      unreadOnly: z.stringbool().default(false),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(50).default(20),
    }),
  },
  markRead: {
    body: z
      .object({ ids: z.array(uuid).min(1).max(100).optional(), all: z.literal(true).optional() })
      .refine((b) => b.ids || b.all, 'Cần truyền ids hoặc all: true'),
  },
};
