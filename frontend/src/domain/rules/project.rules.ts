export const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]{1,5}$/;

const stripAccents = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

/**
 * PRJ-01: gợi ý mã dự án từ tên.
 * "Marketing" → "MAR", "Phòng Nhân sự" → "PNS", "Kế toán 2026" → "KT2026" (cắt còn 6 ký tự).
 */
export function suggestProjectKey(name: string): string {
  const words = stripAccents(name)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '';

  let key = words.length === 1 ? words[0].slice(0, 3) : words.map((w) => (/^\d+$/.test(w) ? w : w[0])).join('');
  key = key.replace(/^\d+/, '').slice(0, 6);
  return key.length >= 2 ? key : (words[0] + 'X').slice(0, 2).replace(/^\d/, 'P');
}

/** Bảng màu gợi ý cho nhãn và dự án. */
export const COLOR_SWATCHES = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];
