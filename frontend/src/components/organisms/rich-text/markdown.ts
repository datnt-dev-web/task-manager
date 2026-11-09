import { marked } from 'marked';

// Dấu hiệu Markdown rõ ràng — tránh biến đoạn văn thường thành định dạng ngoài ý muốn.
const MARKDOWN_PATTERNS = [
  /^#{1,6}\s+\S/m, // tiêu đề
  /^\s*[-*+]\s+\[[ xX]\]\s/m, // checklist
  /^\s*[-*+]\s+\S/m, // danh sách chấm
  /^\s*\d+[.)]\s+\S/m, // danh sách số
  /\*\*[^*\n]+\*\*/, // đậm
  /(^|\s)_[^_\n]+_(\s|$)/, // nghiêng
  /~~[^~\n]+~~/, // gạch ngang
  /`[^`\n]+`/, // mã nội dòng
  /^```/m, // khối mã
  /^\s*>\s+\S/m, // trích dẫn
  /^\|.+\|\s*$/m, // bảng
  /\[[^\]\n]+\]\([^)\s]+\)/, // link
  /^\s*(---|\*\*\*)\s*$/m, // kẻ ngang
];

/** Văn bản dán vào có phải Markdown không (cần ít nhất 1 dấu hiệu rõ ràng). */
export function looksLikeMarkdown(text: string) {
  if (!text || text.length > 200_000) return false;
  return MARKDOWN_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Markdown → HTML để TipTap đọc vào (chỉ giữ các phần tử editor hỗ trợ; backend làm sạch lần nữa).
 * - Checklist GFM "- [ ] việc" → taskList/taskItem của TipTap.
 * - Ảnh từ link ngoài → link (hệ thống chỉ cho chèn ảnh là tệp đính kèm).
 */
export function markdownToHtml(markdown: string): string {
  const html = marked.parse(markdown, { gfm: true, breaks: true, async: false }) as string;
  const doc = new DOMParser().parseFromString(html, 'text/html');

  doc.querySelectorAll('img').forEach((img) => {
    const link = doc.createElement('a');
    link.setAttribute('href', img.getAttribute('src') ?? '');
    link.textContent = img.getAttribute('alt') || img.getAttribute('src') || 'ảnh';
    img.replaceWith(link);
  });

  doc.querySelectorAll('li').forEach((li) => {
    const checkbox = li.querySelector(':scope > input[type="checkbox"], :scope > p > input[type="checkbox"]');
    if (!checkbox) return;
    li.setAttribute('data-type', 'taskItem');
    li.setAttribute('data-checked', String(checkbox.hasAttribute('checked')));
    checkbox.remove();
    li.parentElement?.setAttribute('data-type', 'taskList');
  });

  return doc.body.innerHTML;
}
