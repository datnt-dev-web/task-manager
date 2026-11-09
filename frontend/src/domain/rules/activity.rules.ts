import { format, parseISO } from 'date-fns';
import type { ActivityLog, TaskPriority, TaskType } from '../entities';
import { PRIORITY_LABELS, TASK_TYPE_LABELS } from './task.rules';

const FIELD_LABELS: Record<string, string> = {
  title: 'tiêu đề',
  type: 'loại',
  priority: 'mức ưu tiên',
  dueDate: 'hạn',
  assignee: 'người làm',
  status: 'trạng thái',
  labels: 'nhãn',
  sprint: 'sprint',
  description: 'mô tả',
};

function formatValue(field: string | null, value: string | null): string {
  if (value == null || value === '') return 'Trống';
  if (field === 'priority') return PRIORITY_LABELS[value as TaskPriority] ?? value;
  if (field === 'type') return TASK_TYPE_LABELS[value as TaskType] ?? value;
  if (field === 'dueDate') return format(parseISO(value), 'dd/MM/yyyy');
  if (field === 'sprint' && !value) return 'Backlog';
  return value;
}

export interface ActivityDescription {
  summary: string;
  /** Có khi là thay đổi trường: hiển thị "cũ → mới". */
  change?: { from: string; to: string };
}

/** TSK-09: câu mô tả một dòng lịch sử, ví dụ "đã đổi người làm: Trống → Lan". */
export function describeActivity(a: ActivityLog): ActivityDescription {
  switch (a.action) {
    case 'created':
      return { summary: 'đã tạo công việc' };
    case 'deleted':
      return { summary: 'đã xóa công việc' };
    case 'returned':
      return { summary: 'đã trả lại công việc', change: { from: a.oldValue ?? '', to: a.newValue ?? '' } };
    case 'subtask_added':
      return { summary: `đã thêm việc con “${a.newValue}”` };
    case 'subtask_completed':
      return { summary: `đã hoàn thành việc con “${a.newValue}”` };
    case 'subtask_reopened':
      return { summary: `đã mở lại việc con “${a.newValue}”` };
    case 'subtask_removed':
      return { summary: `đã xóa việc con “${a.oldValue}”` };
    case 'attachment_added':
      return { summary: `đã đính kèm “${a.newValue}”` };
    case 'attachment_removed':
      return { summary: `đã xóa tệp “${a.oldValue}”` };
    case 'updated': {
      const label = FIELD_LABELS[a.field ?? ''] ?? a.field ?? '';
      if (a.field === 'description') return { summary: 'đã cập nhật mô tả' };
      if (a.field === 'sprint') {
        return {
          summary: 'đã chuyển sprint',
          change: { from: a.oldValue ?? 'Backlog', to: a.newValue ?? 'Backlog' },
        };
      }
      return {
        summary: `đã đổi ${label}`,
        change: { from: formatValue(a.field, a.oldValue), to: formatValue(a.field, a.newValue) },
      };
    }
  }
}
