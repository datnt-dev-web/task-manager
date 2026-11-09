const { z, uuid, text, hexColor, richDoc, params, atLeastOne } = require('./common');

const projectParams = params({ projectId: uuid });
const role = z.enum(['manager', 'member'], { error: 'Vai trò không hợp lệ' });

const editable = {
  name: text('Tên dự án', 1, 120),
  description: richDoc.nullable(),
  icon: z.string().max(32).nullable(),
  color: hexColor.nullable(),
};

module.exports = {
  list: {
    query: z.object({
      archived: z.stringbool().default(false),
      q: z.string().trim().max(100).optional(),
      page: z.coerce.number().int().min(1).optional(),
      pageSize: z.coerce.number().int().min(1).max(100).optional(),
    }),
  },
  byId: { params: projectParams },
  create: {
    body: z.object({
      ...editable,
      key: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z][A-Z0-9]{1,5}$/, 'Mã dự án gồm 2–6 ký tự in hoa hoặc số, bắt đầu bằng chữ cái'),
      description: editable.description.optional(),
      icon: editable.icon.optional(),
      color: editable.color.optional(),
    }),
  },
  update: {
    params: projectParams,
    body: atLeastOne(
      z.object({
        name: editable.name.optional(),
        description: editable.description.optional(),
        icon: editable.icon.optional(),
        color: editable.color.optional(),
        archived: z.boolean().optional(),
      }),
    ),
  },
  addMember: { params: projectParams, body: z.object({ userId: uuid, role: role.default('member') }) },
  updateMember: { params: params({ projectId: uuid, userId: uuid }), body: z.object({ role }) },
  removeMember: { params: params({ projectId: uuid, userId: uuid }) },
};
