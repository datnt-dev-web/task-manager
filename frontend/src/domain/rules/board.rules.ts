import type { Task } from '../entities';

/** Công việc của một cột, theo thứ tự hiển thị. */
export const tasksOfColumn = (tasks: Task[], columnId: string) =>
  tasks.filter((t) => t.columnId === columnId).sort((a, b) => a.position - b.position);

/**
 * Sau khi thả, xác định công việc liền trên/dưới vị trí mới để gửi cho API move.
 * `ordered` là danh sách cột đích đã gồm công việc vừa thả, đúng thứ tự mới.
 */
export function neighborsAfterDrop(ordered: Task[], taskId: string) {
  const index = ordered.findIndex((t) => t.id === taskId);
  return {
    prevTaskId: index > 0 ? ordered[index - 1].id : null,
    nextTaskId: index >= 0 && index < ordered.length - 1 ? ordered[index + 1].id : null,
  };
}

/** Vị trí tạm thời phía client (optimistic) — server sẽ trả vị trí chính thức. */
export function optimisticPosition(prev?: Task | null, next?: Task | null) {
  if (!prev && !next) return 1024;
  if (!prev) return next!.position - 1024;
  if (!next) return prev.position + 1024;
  return (prev.position + next.position) / 2;
}
