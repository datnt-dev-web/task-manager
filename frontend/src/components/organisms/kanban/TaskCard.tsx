import { memo } from 'react';
import { ListChecks } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/domain/entities';
import { CANNOT_MOVE_HINT } from '@/domain/rules/permissions';
import { LabelChip } from '@/components/atoms/LabelChip';
import { PriorityIcon } from '@/components/atoms/PriorityIcon';
import { TaskKey } from '@/components/atoms/TaskKey';
import { TaskTypeIcon } from '@/components/atoms/TaskTypeIcon';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { DueDateBadge } from '@/components/molecules/DueDateBadge';
import { cn } from '@/lib/utils';

interface TaskCardViewProps {
  task: Task;
  onOpen?: (task: Task) => void;
  dragging?: boolean;
  overlay?: boolean;
}

/** BRD-06: mã, tiêu đề, người làm, hạn (đỏ nếu quá hạn), ưu tiên, nhãn. */
export const TaskCardView = memo(function TaskCardView({ task, onOpen, dragging, overlay }: TaskCardViewProps) {
  const done = !!task.completedAt;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen?.(task);
      }}
      className={cn(
        'bg-card group space-y-2 rounded-md border p-2.5 text-left text-sm shadow-xs transition-shadow hover:shadow-sm',
        'focus-visible:ring-ring outline-none focus-visible:ring-2',
        dragging && 'opacity-40',
        overlay && 'rotate-2 cursor-grabbing shadow-lg',
      )}
    >
      <p className={cn('line-clamp-3 leading-snug', done && 'text-muted-foreground')}>{task.title}</p>
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <LabelChip key={label.id} label={label} />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <TaskTypeIcon type={task.type} />
        <TaskKey value={task.key} done={done} />
        <DueDateBadge task={task} />
        {!!task.subtaskCount && (
          <span
            className={cn(
              'text-muted-foreground inline-flex items-center gap-0.5 text-xs tabular-nums',
              task.subtaskDoneCount === task.subtaskCount && 'text-green-600 dark:text-green-400',
            )}
            title="Việc con đã xong"
          >
            <ListChecks className="size-3.5" aria-hidden />
            {task.subtaskDoneCount}/{task.subtaskCount}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          <PriorityIcon priority={task.priority} />
          <UserAvatar user={task.assignee} size="sm" />
        </span>
      </div>
    </div>
  );
});

export function SortableTaskCard({
  task,
  onOpen,
  disabled,
  lockedHint = false,
}: {
  task: Task;
  onOpen: (task: Task) => void;
  disabled: boolean;
  /** Người dùng sửa được dự án nhưng không kéo được thẻ này → hiện gợi ý lý do. */
  lockedHint?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(!disabled && 'cursor-grab touch-manipulation')}
      title={disabled && lockedHint ? CANNOT_MOVE_HINT : undefined}
    >
      <TaskCardView task={task} onOpen={onOpen} dragging={isDragging} />
    </div>
  );
}
