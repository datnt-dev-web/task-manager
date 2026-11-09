import { differenceInCalendarDays, endOfWeek, parseISO } from 'date-fns';
import type { Task, TaskPriority, TaskType } from '../entities';

export const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Khẩn cấp',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  task: 'Công việc',
  bug: 'Lỗi',
};

/** BR-06: quá hạn khi hạn < hôm nay và chưa hoàn thành. */
export function isOverdue(task: Pick<Task, 'dueDate' | 'completedAt'>, today = new Date()) {
  if (!task.dueDate || task.completedAt) return false;
  return differenceInCalendarDays(parseISO(task.dueDate), today) < 0;
}

/** Bộ lọc nhanh theo hạn (BRD-08, SRC-02). "Sắp đến hạn" = hôm nay → 3 ngày tới, chưa xong. */
export type DueFilter = 'overdue' | 'soon' | 'none';
export const DUE_SOON_DAYS = 3;
export const DUE_FILTER_LABELS: Record<DueFilter, string> = {
  overdue: 'Quá hạn',
  soon: `Sắp đến hạn (${DUE_SOON_DAYS} ngày)`,
  none: 'Không có hạn',
};

export function matchesDue(task: Pick<Task, 'dueDate' | 'completedAt'>, filter: DueFilter, today = new Date()) {
  if (filter === 'none') return !task.dueDate;
  if (filter === 'overdue') return isOverdue(task, today);
  if (!task.dueDate || task.completedAt) return false;
  const diff = differenceInCalendarDays(parseISO(task.dueDate), today);
  return diff >= 0 && diff <= DUE_SOON_DAYS;
}

export type DueGroup = 'overdue' | 'today' | 'thisWeek' | 'later' | 'noDate';

export const DUE_GROUP_LABELS: Record<DueGroup, string> = {
  overdue: 'Quá hạn',
  today: 'Hôm nay',
  thisWeek: 'Tuần này',
  later: 'Sau đó',
  noDate: 'Không có hạn',
};

/** DSH-01: nhóm "Việc của tôi" theo hạn. Tuần bắt đầu từ thứ Hai. */
export function dueGroupOf(task: Pick<Task, 'dueDate'>, today = new Date()): DueGroup {
  if (!task.dueDate) return 'noDate';
  const due = parseISO(task.dueDate);
  const diff = differenceInCalendarDays(due, today);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (due <= endOfWeek(today, { weekStartsOn: 1 })) return 'thisWeek';
  return 'later';
}

export function groupByDue<T extends Pick<Task, 'dueDate'>>(tasks: T[]) {
  const groups: Record<DueGroup, T[]> = { overdue: [], today: [], thisWeek: [], later: [], noDate: [] };
  for (const task of tasks) groups[dueGroupOf(task)].push(task);
  return groups;
}
