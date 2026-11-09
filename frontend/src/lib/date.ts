import { format, formatDistanceToNow, isThisYear, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

/** "2026-11-15" → "15/11" (cùng năm) hoặc "15/11/2027". */
export function formatDueDate(isoDate: string) {
  const date = parseISO(isoDate);
  return format(date, isThisYear(date) ? 'dd/MM' : 'dd/MM/yyyy');
}

export const formatDateTime = (iso: string) => format(parseISO(iso), 'HH:mm dd/MM/yyyy');

export const fromNow = (iso: string) => formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: vi });

/** Date → "YYYY-MM-DD" theo giờ địa phương (không lệch múi giờ như toISOString). */
export const toIsoDate = (date: Date) => format(date, 'yyyy-MM-dd');
