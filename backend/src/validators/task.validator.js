const { z, uuid, text, richDoc, pagination, csv, params, atLeastOne } = require('./common');

const TYPES = ['task', 'bug'];
const PRIORITIES = ['urgent', 'high', 'medium', 'low'];

const taskKey = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9]{1,5}-\d+$/, 'Mã công việc không hợp lệ');
const keyParams = params({ key: taskKey });
const date = z.iso.date({ error: 'Ngày phải ở dạng YYYY-MM-DD' });

const fields = {
  title: text('Tiêu đề', 1, 255),
  type: z.enum(TYPES),
  columnId: uuid,
  assigneeId: uuid.nullable(),
  priority: z.enum(PRIORITIES),
  dueDate: date.nullable(),
  description: richDoc.nullable(),
  labelIds: z.array(uuid).max(20),
};

module.exports = {
  list: {
    params: params({ projectId: uuid }),
    query: z.object({
      ...pagination,
      q: z.string().trim().max(200).optional(),
      assignee: z.union([z.literal('me'), z.literal('none'), uuid]).optional(),
      columnIds: csv(uuid).optional(),
      priorities: csv(z.enum(PRIORITIES)).optional(),
      type: z.enum(TYPES).optional(),
      labelId: uuid.optional(),
      // Nhiều nhãn: việc có ÍT NHẤT MỘT nhãn trong danh sách
      labelIds: csv(uuid).optional(),
      // Lọc nhanh theo hạn: quá hạn / sắp đến hạn (≤ 3 ngày) / không có hạn
      due: z.enum(['overdue', 'soon', 'none']).optional(),
      dueFrom: date.optional(),
      dueTo: date.optional(),
      sort: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'number', 'title']).default('createdAt'),
      order: z.enum(['asc', 'desc']).default('desc'),
    }),
  },
  create: {
    params: params({ projectId: uuid }),
    body: z.object({
      title: fields.title,
      type: fields.type.default('task'),
      priority: fields.priority.default('medium'),
      columnId: fields.columnId.optional(),
      assigneeId: fields.assigneeId.optional(),
      dueDate: fields.dueDate.optional(),
      description: fields.description.optional(),
      labelIds: fields.labelIds.optional(),
      sprintId: uuid.nullable().optional(),
    }),
  },
  byKey: { params: keyParams },
  /** SRC-03: tìm nhanh toàn hệ thống theo mã hoặc tiêu đề. */
  quickSearch: {
    query: z.object({
      q: z.string().trim().min(1, 'Nhập từ khóa').max(100),
      limit: z.coerce.number().int().min(1).max(20).default(8),
    }),
  },
  update: {
    params: keyParams,
    body: atLeastOne(
      z.object({
        title: fields.title.optional(),
        type: fields.type.optional(),
        priority: fields.priority.optional(),
        columnId: fields.columnId.optional(),
        assigneeId: fields.assigneeId.optional(),
        dueDate: fields.dueDate.optional(),
        description: fields.description.optional(),
        labelIds: fields.labelIds.optional(),
      }),
    ),
  },
  calendar: {
    params: params({ projectId: uuid }),
    query: z.object({ from: date, to: date }),
  },
  plan: {
    params: keyParams,
    body: z.object({
      sprintId: uuid.nullable(),
      prevTaskId: uuid.nullable().optional(),
      nextTaskId: uuid.nullable().optional(),
    }),
  },
  move: {
    params: keyParams,
    body: z.object({
      columnId: uuid,
      prevTaskId: uuid.nullable().optional(),
      nextTaskId: uuid.nullable().optional(),
    }),
  },
};
