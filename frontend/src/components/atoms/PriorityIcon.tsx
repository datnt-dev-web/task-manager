import { ChevronDown, ChevronsUp, ChevronUp, Equal, type LucideIcon } from 'lucide-react';
import type { TaskPriority } from '@/domain/entities';
import { PRIORITY_LABELS } from '@/domain/rules/task.rules';
import { cn } from '@/lib/utils';

const ICONS: Record<TaskPriority, { icon: LucideIcon; className: string }> = {
  urgent: { icon: ChevronsUp, className: 'text-red-600 dark:text-red-400' },
  high: { icon: ChevronUp, className: 'text-orange-600 dark:text-orange-400' },
  medium: { icon: Equal, className: 'text-amber-600 dark:text-amber-400' },
  low: { icon: ChevronDown, className: 'text-sky-600 dark:text-sky-400' },
};

export function PriorityIcon({ priority, className }: { priority: TaskPriority; className?: string }) {
  const { icon: Icon, className: color } = ICONS[priority];
  return (
    <Icon
      className={cn('size-4 shrink-0', color, className)}
      aria-label={`Ưu tiên ${PRIORITY_LABELS[priority]}`}
      role="img"
    />
  );
}
