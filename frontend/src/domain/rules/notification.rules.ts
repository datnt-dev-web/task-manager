import type { AppNotification } from '../entities';
import { displayName } from './user.rules';

/** Câu thông báo tiếng Việt cho từng loại sự kiện (NTF). */
export function notificationText(n: AppNotification): string {
  const actor = n.actor ? displayName(n.actor) : 'Hệ thống';
  const key = n.task?.key ?? n.data.taskKey ?? '';
  switch (n.type) {
    case 'task_assigned':
      return n.data.subtaskTitle
        ? `${actor} đã giao cho bạn việc con “${n.data.subtaskTitle}” trong ${key}`
        : `${actor} đã giao cho bạn ${key}`;
    case 'mentioned':
      return `${actor} đã nhắc đến bạn trong ${n.data.context === 'comment' ? 'bình luận của ' : ''}${key}`;
    case 'comment_added':
      return `${actor} đã bình luận trong ${key}`;
    case 'status_changed':
      return `${actor} đã chuyển ${key} sang “${n.data.to ?? ''}”`;
    case 'added_to_project':
      return `${actor} đã thêm bạn vào dự án ${n.project?.name ?? n.data.projectName ?? ''}`;
    case 'due_soon':
      return `${key} sẽ đến hạn vào ngày mai`;
    case 'overdue':
      return `${key} đã quá hạn`;
    case 'task_returned':
      return `${actor} đã trả lại ${key} về “${n.data.to ?? ''}”`;
  }
}

/** Dòng phụ: trích bình luận hoặc tiêu đề công việc. */
export const notificationDetail = (n: AppNotification) =>
  (n.type === 'task_returned' && n.data.reason ? `Lý do: ${n.data.reason}` : null) ??
  n.data.excerpt ??
  n.task?.title ??
  n.data.taskTitle ??
  '';

/** Đường dẫn mở khi bấm vào thông báo. */
export function notificationLink(n: AppNotification): string {
  const key = n.task?.key ?? n.data.taskKey;
  const projectId = n.task?.projectId ?? n.projectId;
  if (key && projectId) return `/projects/${projectId}?task=${encodeURIComponent(key)}`;
  return projectId ? `/projects/${projectId}` : '/';
}

export const EMAIL_SETTING_LABELS = {
  taskAssigned: 'Khi được giao việc hoặc bị trả lại việc',
  mentioned: 'Khi được @nhắc tên',
  dueSoon: 'Nhắc trước 1 ngày khi việc sắp đến hạn',
  overdue: 'Khi việc của tôi quá hạn',
  addedToProject: 'Khi được thêm vào dự án',
} as const;
