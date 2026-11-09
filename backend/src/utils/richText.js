// Tiện ích cho nội dung rich text dạng JSON của TipTap/ProseMirror.

const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'blockquote',
  'codeBlock',
  'listItem',
  'taskItem',
  'horizontalRule',
  'tableRow',
  'tableCell',
  'tableHeader',
]);

/** Trích văn bản thuần từ tài liệu TipTap để tìm kiếm và hiển thị tóm tắt. */
function extractText(node) {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'mention') return `@${node.attrs?.label ?? ''}`;
  if (node.type === 'hardBreak') return '\n';
  const inner = Array.isArray(node.content) ? node.content.map(extractText).join('') : '';
  return BLOCK_TYPES.has(node.type) ? `${inner}\n` : inner;
}

const toPlainText = (doc) => (doc ? extractText(doc).replace(/\n{3,}/g, '\n\n').trim() : null);

/** Lấy danh sách id người được @nhắc trong tài liệu. */
function extractMentionIds(node, acc = new Set()) {
  if (!node || typeof node !== 'object') return acc;
  if (node.type === 'mention' && node.attrs?.id) acc.add(node.attrs.id);
  if (Array.isArray(node.content)) node.content.forEach((child) => extractMentionIds(child, acc));
  return acc;
}

const SAFE_LINK = /^(https?:|mailto:|\/(?!\/))/i;
const ATTACHMENT_SRC = /^\/api\/v1\/attachments\/[0-9a-f-]{36}\/download(\?inline=1)?$/i;

/**
 * Làm sạch tài liệu trước khi lưu (chống XSS):
 * - link chỉ cho http(s), mailto hoặc đường dẫn nội bộ;
 * - ảnh chỉ được trỏ tới tệp đính kèm của hệ thống (RTE-05).
 */
function sanitizeDoc(node) {
  if (!node || typeof node !== 'object') return node;
  if (node.type === 'image' && !ATTACHMENT_SRC.test(String(node.attrs?.src ?? ''))) return null;

  const clean = { ...node };
  if (Array.isArray(node.marks)) {
    clean.marks = node.marks.filter((m) => m.type !== 'link' || SAFE_LINK.test(String(m.attrs?.href ?? '')));
  }
  if (Array.isArray(node.content)) clean.content = node.content.map(sanitizeDoc).filter(Boolean);
  return clean;
}

module.exports = { toPlainText, extractMentionIds, sanitizeDoc };
