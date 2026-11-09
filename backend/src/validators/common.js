const { z } = require('zod');

const uuid = z.uuid({ error: 'ID không hợp lệ' });

const text = (label, min, max) =>
  z
    .string({ error: `${label} phải là chuỗi` })
    .trim()
    .min(min, `${label} không được để trống`)
    .max(max, `${label} tối đa ${max} ký tự`);

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Màu phải ở dạng #RRGGBB');

/** Tài liệu rich text dạng JSON của TipTap. */
const richDoc = z
  .object({ type: z.literal('doc'), content: z.array(z.any()).optional() })
  .loose()
  .refine((doc) => JSON.stringify(doc).length <= 200_000, 'Nội dung quá dài');

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
};

/** "a,b,c" → ["a","b","c"] rồi kiểm tra từng phần tử. */
const csv = (item) =>
  z
    .string()
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(item));

const params = (shape) => z.object(shape);

const atLeastOne = (schema) =>
  schema.refine((obj) => Object.keys(obj).length > 0, 'Cần ít nhất một trường để cập nhật');

module.exports = { z, uuid, text, hexColor, richDoc, pagination, csv, params, atLeastOne };
