import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { Sprint, Task } from '../entities';

export const SPRINT_STATE_LABELS = { planned: 'Chưa bắt đầu', active: 'Đang chạy', completed: 'Đã hoàn thành' } as const;
export const DEFAULT_SPRINT_DAYS = 14;

export function sprintDateRange(sprint: Pick<Sprint, 'startDate' | 'endDate'>) {
  if (!sprint.startDate || !sprint.endDate) return null;
  return `${format(parseISO(sprint.startDate), 'dd/MM')} – ${format(parseISO(sprint.endDate), 'dd/MM/yyyy')}`;
}

/** Số ngày còn lại của sprint (âm = đã quá ngày kết thúc). */
export const sprintDaysLeft = (sprint: Pick<Sprint, 'endDate'>, today = new Date()) =>
  sprint.endDate ? differenceInCalendarDays(parseISO(sprint.endDate), today) : null;

export function sprintProgress(tasks: Pick<Task, 'completedAt'>[]) {
  const done = tasks.filter((t) => t.completedAt).length;
  return { done, total: tasks.length, open: tasks.length - done };
}

/** Thứ tự ưu tiên tạm thời phía client khi kéo thả trong backlog (server trả giá trị chính thức). */
export function optimisticRank(prev?: Pick<Task, 'backlogRank'> | null, next?: Pick<Task, 'backlogRank'> | null) {
  const p = prev?.backlogRank;
  const n = next?.backlogRank;
  if (p == null && n == null) return 1024;
  if (p == null) return n! - 1024;
  if (n == null) return p + 1024;
  return (p + n) / 2;
}

/** Ngày mặc định khi bắt đầu sprint: hôm nay → +2 tuần. */
export function defaultSprintDates(today = new Date()) {
  return { startDate: format(today, 'yyyy-MM-dd'), endDate: format(addDays(today, DEFAULT_SPRINT_DAYS), 'yyyy-MM-dd') };
}
