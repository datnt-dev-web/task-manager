const { z, uuid, params } = require('./common');
const { FILE_KINDS } = require('../utils/fileType');
const { byKey } = require('./task.validator');

module.exports = {
  search: {
    query: z.object({
      q: z.string().trim().max(200).optional(),
      projectId: uuid.optional(),
      kind: z.enum(Object.keys(FILE_KINDS)).optional(),
      mine: z.stringbool().default(false),
      sort: z.enum(['newest', 'oldest', 'name', 'size']).default('newest'),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(30),
    }),
  },
  byTask: { params: byKey.params },
  download: {
    params: params({ attachmentId: uuid }),
    query: z.object({ inline: z.enum(['0', '1', 'true', 'false']).optional() }),
  },
  remove: { params: params({ attachmentId: uuid }) },
};
