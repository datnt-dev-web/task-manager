import { useMemo, useState, type FormEvent } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Task, TaskPriority } from '@/domain/entities';
import { isOverdue } from '@/domain/rules/task.rules';
import { useCreateTask } from '@/application/board/useBoard';
import { useCalendar, useRescheduleTask } from '@/application/tasks/useActivityAndCalendar';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toIsoDate } from '@/lib/date';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const PRIORITY_BAR: Record<TaskPriority, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-amber-400',
  low: 'border-l-sky-500',
};

const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : closestCenter(args);
};

interface CalendarViewProps {
  projectId: string;
  canEdit: boolean;
  canMove: (task: Task) => boolean;
  onOpenTask: (task: Task) => void;
}

/** RPT-05: lịch tháng theo hạn chót; kéo thả sang ngày khác để đổi hạn. Tuần bắt đầu từ thứ Hai. */
export function CalendarView({ projectId, canEdit, canMove, onOpenTask }: CalendarViewProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(month, { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );
  const from = toIsoDate(days[0]);
  const to = toIsoDate(days[days.length - 1]);
  const { data, isFetching } = useCalendar(projectId, from, to);
  const reschedule = useRescheduleTask(projectId, from, to);
  const [dragging, setDragging] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of data?.tasks ?? []) {
      if (!task.dueDate) continue;
      map.set(task.dueDate, [...(map.get(task.dueDate) ?? []), task]);
    }
    return map;
  }, [data]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-6 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold capitalize">{format(month, "'Tháng' M, yyyy")}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Tháng trước" onClick={() => setMonth((m) => addMonths(m, -1))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
            Hôm nay
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Tháng sau" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight />
          </Button>
        </div>
        {isFetching && <Spinner className="size-4" />}
        {!!data?.withoutDueDate && (
          <span className="text-muted-foreground ml-auto text-xs">{data.withoutDueDate} việc chưa xong chưa có hạn (xem ở dạng Danh sách)</span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={({ active }) => setDragging((active.data.current?.task as Task) ?? null)}
        onDragCancel={() => setDragging(null)}
        onDragEnd={({ active, over }) => {
          setDragging(null);
          const task = active.data.current?.task as Task | undefined;
          const date = over?.data.current?.date as string | undefined;
          if (task && date && date !== task.dueDate) reschedule.mutate({ task, dueDate: date });
        }}
      >
        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-7 overflow-hidden rounded-lg border">
            {WEEKDAYS.map((d) => (
              <div key={d} className="bg-muted/60 text-muted-foreground border-b px-2 py-1.5 text-center text-xs font-medium">
                {d}
              </div>
            ))}
            {days.map((day) => {
              const iso = toIsoDate(day);
              return (
                <DayCell
                  key={iso}
                  iso={iso}
                  day={day}
                  inMonth={isSameMonth(day, month)}
                  tasks={byDay.get(iso) ?? []}
                  canEdit={canEdit}
                  canMove={canMove}
                  projectId={projectId}
                  onOpenTask={onOpenTask}
                />
              );
            })}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>{dragging && <TaskChipView task={dragging} overlay />}</DragOverlay>
      </DndContext>
    </div>
  );
}

function DayCell({
  iso,
  day,
  inMonth,
  tasks,
  canEdit,
  canMove,
  projectId,
  onOpenTask,
}: {
  iso: string;
  day: Date;
  inMonth: boolean;
  tasks: Task[];
  canEdit: boolean;
  canMove: (task: Task) => boolean;
  projectId: string;
  onOpenTask: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${iso}`, data: { type: 'day', date: iso } });
  const today = isToday(day);
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group/day flex min-h-28 flex-col gap-1 border-r border-b p-1.5 [&:nth-child(7n)]:border-r-0',
        !inMonth && 'bg-muted/30',
        isOver && 'bg-primary/10',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex size-6 items-center justify-center rounded-full text-xs',
            !inMonth && 'text-muted-foreground',
            today && 'bg-primary text-primary-foreground font-semibold',
          )}
        >
          {format(day, 'd')}
        </span>
        {canEdit && <QuickAddOnDay projectId={projectId} iso={iso} />}
      </div>
      <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
        {tasks.map((task) => (
          <DraggableChip key={task.id} task={task} disabled={!canMove(task)} onOpen={onOpenTask} />
        ))}
      </div>
    </div>
  );
}

function TaskChipView({ task, overlay, onOpen }: { task: Task; overlay?: boolean; onOpen?: (task: Task) => void }) {
  const done = !!task.completedAt;
  return (
    <button
      type="button"
      onClick={() => onOpen?.(task)}
      title={`${task.key}: ${task.title}`}
      className={cn(
        'bg-card w-full truncate rounded border border-l-4 px-1.5 py-0.5 text-left text-xs',
        PRIORITY_BAR[task.priority],
        done && 'text-muted-foreground line-through',
        isOverdue(task) && 'text-red-600 dark:text-red-400',
        overlay && 'w-44 shadow-lg',
      )}
    >
      <span className="text-muted-foreground mr-1 font-medium">{task.key}</span>
      {task.title}
    </button>
  );
}

function DraggableChip({ task, disabled, onOpen }: { task: Task; disabled: boolean; onOpen: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { type: 'task', task }, disabled });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={cn(isDragging && 'opacity-40', !disabled && 'cursor-grab touch-manipulation')}>
      <TaskChipView task={task} onOpen={onOpen} />
    </div>
  );
}

/** Thêm nhanh công việc có hạn đúng ngày được bấm. */
function QuickAddOnDay({ projectId, iso }: { projectId: string; iso: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const create = useCreateTask(projectId);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate({ title: title.trim(), dueDate: iso }, { onSuccess: () => setTitle('') });
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Thêm công việc hạn ${format(new Date(`${iso}T00:00:00`), 'dd/MM')}`}
          className="opacity-0 group-hover/day:opacity-100 focus-visible:opacity-100"
        >
          <Plus />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <form onSubmit={submit}>
          <Input autoFocus value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} placeholder="Cần làm gì? Nhấn Enter" />
        </form>
      </PopoverContent>
    </Popover>
  );
}
