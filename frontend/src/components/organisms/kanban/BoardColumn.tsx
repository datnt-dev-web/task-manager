import { memo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CircleCheck, GripVertical, MoreHorizontal, Trash2 } from 'lucide-react';
import type { BoardColumn as Column, Task } from '@/domain/entities';
import { useUpdateColumn } from '@/application/board/useBoard';
import { InlineEditText } from '@/components/molecules/InlineEditText';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ONLY_MANAGER_COMPLETES_HINT } from '@/domain/rules/permissions';
import { cn } from '@/lib/utils';
import { DeleteColumnDialog } from './DeleteColumnDialog';
import { QuickAddTask } from './QuickAddTask';
import { SortableTaskCard } from './TaskCard';

/** Id sắp xếp của cột khác id vùng thả thẻ (cùng một cột vừa kéo được vừa nhận thẻ). */
export const columnSortId = (columnId: string) => `column:${columnId}`;

interface BoardColumnProps {
  projectId: string;
  sprintId: string | null;
  column: Column;
  columns: Column[];
  tasks: Task[];
  canEdit: boolean;
  canMove: (task: Task) => boolean;
  canManage: boolean;
  onOpenTask: (task: Task) => void;
  /** Đang kéo một thẻ (từ cột khác) vào cột này. */
  dropTarget?: boolean;
  /** Id thẻ vừa được thả vào cột này (chạy hiệu ứng). */
  landedTaskId?: string | null;
}

export const BoardColumn = memo(function BoardColumn({
  projectId,
  sprintId,
  column,
  columns,
  tasks,
  canEdit,
  canMove,
  canManage,
  onOpenTask,
  dropTarget = false,
  landedTaskId = null,
}: BoardColumnProps) {
  const sortable = useSortable({ id: columnSortId(column.id), data: { type: 'column', column }, disabled: !canManage });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column.id, data: { type: 'column-drop', columnId: column.id } });
  const updateColumn = useUpdateColumn(projectId);
  // Cột Hoàn thành: chỉ Quản trị viên / Quản lý dự án được duyệt (kéo vào) hoặc mở lại (kéo ra).
  const locked = column.isDone && !canManage;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <section
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }}
      aria-label={`Cột ${column.name}`}
      className={cn(
        'bg-muted/60 dark:bg-muted/30 flex max-h-full w-72 shrink-0 flex-col rounded-lg outline-2 -outline-offset-2 outline-transparent',
        'transition-[outline-color,background-color] duration-200 ease-out',
        dropTarget && 'bg-primary/5 dark:bg-primary/10 outline-primary',
        sortable.isDragging && 'opacity-40',
      )}
    >
      <header className="group/header flex items-center gap-1 px-2 pt-2.5 pb-2">
        {canManage ? (
          <button
            type="button"
            ref={sortable.setActivatorNodeRef}
            {...sortable.attributes}
            {...sortable.listeners}
            aria-label={`Kéo để đổi vị trí cột ${column.name}`}
            className="text-muted-foreground hover:text-foreground -ml-0.5 cursor-grab touch-none rounded p-0.5 opacity-40 group-hover/header:opacity-100 focus-visible:opacity-100"
          >
            <GripVertical className="size-4" />
          </button>
        ) : (
          <span className="w-1" />
        )}
        {column.isDone && (
          <CircleCheck
            className="size-4 shrink-0 text-green-600 dark:text-green-400"
            aria-label="Cột Hoàn thành"
          />
        )}
        <InlineEditText
          value={column.name}
          maxLength={30}
          disabled={!canManage}
          ariaLabel="Tên cột"
          onSave={(name) => updateColumn.mutate({ columnId: column.id, name })}
          className="text-muted-foreground min-w-0 text-xs font-semibold tracking-wide uppercase"
        />
        <span className="text-muted-foreground text-xs tabular-nums">{tasks.length}</span>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" className="ml-auto" aria-label={`Tùy chọn cột ${column.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={column.isDone} onSelect={() => updateColumn.mutate({ columnId: column.id, isDone: true })}>
                <CircleCheck /> Đặt làm cột Hoàn thành
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={column.isDone || columns.length <= 2}
                onSelect={() => setConfirmDelete(true)}
              >
                <Trash2 /> Xóa cột
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <div
        ref={setDropRef}
        className={cn('flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2', isOver && !dropTarget && 'bg-accent/50 rounded-md')}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onOpen={onOpenTask}
              disabled={locked || !canMove(task)}
              lockedHint={canEdit}
              hint={locked ? ONLY_MANAGER_COMPLETES_HINT : undefined}
              landed={task.id === landedTaskId}
            />
          ))}
        </SortableContext>
        {canEdit && !locked && <QuickAddTask projectId={projectId} columnId={column.id} sprintId={sprintId} />}
      </div>

      {confirmDelete && (
        <DeleteColumnDialog
          projectId={projectId}
          column={column}
          columns={columns}
          taskCount={tasks.length}
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
        />
      )}
    </section>
  );
});
