const { z, uuid, text, pagination, params, atLeastOne } = require('./common');

module.exports = {
  updateMe: {
    body: atLeastOne(
      z.object({
        fullName: text('Họ tên', 1, 120).optional(),
        title: z.string().trim().max(120).nullable().optional(),
        avatarUrl: z.url('Ảnh đại diện phải là URL').max(1000).nullable().optional(),
        theme: z.enum(['light', 'dark', 'system']).optional(),
        emailSettings: z
          .object({
            taskAssigned: z.boolean(),
            mentioned: z.boolean(),
            dueSoon: z.boolean(),
            overdue: z.boolean(),
            addedToProject: z.boolean(),
          })
          .partial()
          .optional(),
      }),
    ),
  },
  list: {
    query: z.object({
      q: z.string().trim().max(100).optional(),
      status: z.enum(['invited', 'active', 'disabled']).optional(),
      ...pagination,
    }),
  },
  invite: {
    body: z.object({
      emails: z.array(z.email('Email không hợp lệ')).min(1, 'Nhập ít nhất 1 email').max(100),
    }),
  },
  adminUpdate: {
    params: params({ userId: uuid }),
    body: atLeastOne(
      z.object({
        status: z.enum(['active', 'disabled']).optional(),
        isAdmin: z.boolean().optional(),
      }),
    ),
  },
};
