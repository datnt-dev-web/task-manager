import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { BoardColumn, Task } from '@/domain/entities';
import { LabelChip } from '@/components/atoms/LabelChip';
import { PriorityIcon } from '@/components/atoms/PriorityIcon';
import { TaskKey } from '@/components/atoms/TaskKey';
import { TaskTypeIcon } from '@/components/atoms/TaskTypeIcon';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { DueDateBadge } from '@/components/molecules/DueDateBadge';
import { cn } from '@/lib/utils';

interface BacklogTaskRowViewProps {
  task: Task;
  column?: Pick<BoardColumn, 'name' | 'isDone'>;
  onOpen?: (task: Task) => void;
  dragging?: boolean;
  overlay?: boolean;
}

/** Dòng công việc gọn trong Backlog/Sprint: loại, mã, tiêu đề, nhãn, trạng thái, hạn, ưu tiên, người làm. */
export const BacklogTaskRowView = memo(function BacklogTaskRowView({ task, column, onOpen, dragging, overlay }: BacklogTaskRowViewProps) {
  const done = !!task.completedAt;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(task)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.(task)}
      className={cn(
        'bg-card hover:bg-muted/40 focus-visible:ring-ring flex items-center gap-2 px-3 py-2 text-sm outline-none focus-visible:ring-2',
        dragging && 'opacity-40',
        overlay && 'rounded-md border shadow-lg',
      )}
    >
      <GripVertical className="text-muted-foreground/50 size-4 shrink-0" aria-hidden />
      <TaskTypeIcon type={task.type} />
      <TaskKey value={task.key} done={done} className="w-16 shrink-0" />
      <span className={cn('min-w-0 flex-1 truncate', done && 'text-muted-foreground line-through')}>{task.title}</span>
      <span className="hidden gap-1 md:flex">
        {task.labels.slice(0, 2).map((l) => (
          <LabelChip key={l.id} label={l} />
        ))}
      </span>
      {column && (
        <span
          className={cn(
            'hidden shrink-0 rounded px-1.5 py-0.5 text-xs sm:inline',
            column.isDone ? 'bg-green-600/15 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground',
          )}
        >
          {column.name}
        </span>
      )}
      <DueDateBadge task={task} className="hidden sm:inline-flex" />
      <PriorityIcon priority={task.priority} />
      <UserAvatar user={task.assignee} size="sm" />
    </div>
  );
});

export function SortableBacklogTaskRow({
  task,
  column,
  onOpen,
  disabled,
}: {
  task: Task;
  column?: Pick<BoardColumn, 'name' | 'isDone'>;
  onOpen: (task: Task) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
    disabled,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(!disabled && 'cursor-grab touch-manipulation')}
    >
      <BacklogTaskRowView task={task} column={column} onOpen={onOpen} dragging={isDragging} />
    </li>
  );
}
