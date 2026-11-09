import { CalendarDays } from 'lucide-react';
import type { Task } from '@/domain/entities';
import { isOverdue } from '@/domain/rules/task.rules';
import { formatDueDate } from '@/lib/date';
import { cn } from '@/lib/utils';

export function DueDateBadge({ task, className }: { task: Pick<Task, 'dueDate' | 'completedAt'>; className?: string }) {
  if (!task.dueDate) return null;
  const overdue = isOverdue(task);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-muted-foreground',
        className,
      )}
      title={overdue ? 'Quá hạn' : 'Hạn chót'}
    >
      <CalendarDays className="size-3.5" aria-hidden />
      {formatDueDate(task.dueDate)}
    </span>
  );
}
