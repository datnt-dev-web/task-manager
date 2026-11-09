import { Bug, SquareCheck } from 'lucide-react';
import type { TaskType } from '@/domain/entities';
import { TASK_TYPE_LABELS } from '@/domain/rules/task.rules';
import { cn } from '@/lib/utils';

export function TaskTypeIcon({ type, className }: { type: TaskType; className?: string }) {
  const Icon = type === 'bug' ? Bug : SquareCheck;
  return (
    <Icon
      role="img"
      aria-label={TASK_TYPE_LABELS[type]}
      className={cn(
        'size-4 shrink-0',
        type === 'bug' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400',
        className,
      )}
    />
  );
}
