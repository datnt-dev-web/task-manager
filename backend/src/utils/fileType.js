const path = require('node:path');

// ATT: danh sách trắng định dạng. Kiểm tra cả đuôi tệp lẫn chữ ký nhị phân (magic bytes),
// không tin MIME type trình duyệt gửi lên.
const SIGNATURES = {
  png: { mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  jpg: { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  gif: { mime: 'image/gif', test: (b) => b.subarray(0, 4).toString('latin1') === 'GIF8' },
  webp: {
    mime: 'image/webp',
    test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
  pdf: { mime: 'application/pdf', test: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' },
  zip: { mime: 'application/zip', test: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04 },
  ole: { mime: 'application/octet-stream', test: (b) => b.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0])) },
  text: { mime: 'text/plain', test: (b) => !b.subarray(0, 4096).includes(0) },
};

const EXTENSIONS = {
  '.png': ['png'],
  '.jpg': ['jpg'],
  '.jpeg': ['jpg'],
  '.gif': ['gif'],
  '.webp': ['webp'],
  '.pdf': ['pdf'],
  '.zip': ['zip'],
  '.docx': ['zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xlsx': ['zip', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.pptx': ['zip', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  '.doc': ['ole', 'application/msword'],
  '.xls': ['ole', 'application/vnd.ms-excel'],
  '.ppt': ['ole', 'application/vnd.ms-powerpoint'],
  '.txt': ['text', 'text/plain; charset=utf-8'],
  '.csv': ['text', 'text/csv; charset=utf-8'],
};

/** Trả về { extension, mime } nếu tệp hợp lệ, ngược lại null. */
function detectAllowedType(fileName, buffer) {
  const extension = path.extname(fileName).toLowerCase();
  const rule = EXTENSIONS[extension];
  if (!rule) return null;
  const [signature, mimeOverride] = rule;
  if (!SIGNATURES[signature].test(buffer)) return null;
  return { extension, mime: mimeOverride ?? SIGNATURES[signature].mime };
}

const INLINE_MIME = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']);
const isInlineViewable = (mime) => INLINE_MIME.has(mime);
const isImage = (mime) => mime.startsWith('image/');

const ALLOWED_EXTENSIONS = Object.keys(EXTENSIONS);

/** Nhóm loại tệp cho bộ lọc ở kho tệp. */
const FILE_KINDS = {
  image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
  document: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'text/plain; charset=utf-8',
    'text/csv; charset=utf-8',
  ],
  archive: ['application/zip'],
};

module.exports = { detectAllowedType, isInlineViewable, isImage, ALLOWED_EXTENSIONS, FILE_KINDS };
