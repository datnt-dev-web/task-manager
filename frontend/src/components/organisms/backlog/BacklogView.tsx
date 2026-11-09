import { useMemo, useState, type FormEvent } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CalendarRange, CirclePlay, MoreHorizontal, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import type { BoardColumn, Sprint, SprintWithTasks, Task } from '@/domain/entities';
import { neighborsAfterDrop } from '@/domain/rules/board.rules';
import { optimisticRank, SPRINT_STATE_LABELS, sprintDateRange, sprintProgress } from '@/domain/rules/sprint.rules';
import { useBoard } from '@/application/board/useBoard';
import { useBacklog, useCreateBacklogTask, usePlanTask, useSprintActions } from '@/application/sprints/useSprints';
import { PageSpinner } from '@/components/atoms/Spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { itemCollision } from '../dnd/collision';
import { BacklogTaskRowView, SortableBacklogTaskRow } from './BacklogTaskRow';
import { CompleteSprintDialog, SprintFormDialog } from './SprintDialogs';

interface BacklogViewProps {
  projectId: string;
  canEdit: boolean;
  canMove: (task: Task) => boolean;
  canManage: boolean;
  onOpenTask: (task: Task) => void;
}

type DropData = { type: 'task'; task: Task } | { type: 'section'; sprintId: string | null };
const collision = itemCollision({ itemType: 'task' });

/** SPR-01..06: Backlog & Sprint — kéo thả để lên kế hoạch và sắp xếp ưu tiên. */
export function BacklogView({ projectId, canEdit, canMove, canManage, onOpenTask }: BacklogViewProps) {
  const { data, isLoading } = useBacklog(projectId);
  const { data: boardView } = useBoard(projectId);
  const plan = usePlanTask(projectId);
  const actions = useSprintActions(projectId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [formSprint, setFormSprint] = useState<{ sprint: Sprint; mode: 'start' | 'edit' } | null>(null);
  const [completing, setCompleting] = useState<SprintWithTasks | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columnsById = useMemo(
    () => new Map((boardView?.board.columns ?? []).map((c) => [c.id, c] as [string, BoardColumn])),
    [boardView],
  );

  if (isLoading || !data) return <PageSpinner />;

  const listOf = (sprintId: string | null) => (sprintId ? data.sprints.find((s) => s.id === sprintId)?.tasks ?? [] : data.backlog);
  const hasActive = data.sprints.some((s) => s.state === 'active');
  const plannedSprints = data.sprints.filter((s) => s.state === 'planned');

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    const task = active.data.current?.task as Task | undefined;
    const target = over?.data.current as DropData | undefined;
    if (!task || !target || !canMove(task)) return;

    const targetSprintId = target.type === 'task' ? (target.task.sprintId ?? null) : target.sprintId;
    const list = listOf(targetSprintId);
    let ordered: Task[];
    if (targetSprintId === (task.sprintId ?? null)) {
      if (target.type !== 'task') return;
      ordered = arrayMove(
        list,
        list.findIndex((t) => t.id === task.id),
        list.findIndex((t) => t.id === target.task.id),
      );
    } else {
      const without = list.filter((t) => t.id !== task.id);
      const index = target.type === 'task' ? without.findIndex((t) => t.id === target.task.id) : without.length;
      ordered = [...without.slice(0, index), task, ...without.slice(index)];
    }
    const { prevTaskId, nextTaskId } = neighborsAfterDrop(ordered, task.id);
    plan.mutate({
      task,
      sprintId: targetSprintId,
      prevTaskId,
      nextTaskId,
      optimisticRank: optimisticRank(
        ordered.find((t) => t.id === prevTaskId),
        ordered.find((t) => t.id === nextTaskId),
      ),
    });
  };

  const renderRows = (tasks: Task[]) => (
    <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
      {tasks.map((task) => (
        <SortableBacklogTaskRow key={task.id} task={task} column={columnsById.get(task.columnId)} onOpen={onOpenTask} disabled={!canMove(task)} />
      ))}
    </SortableContext>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={({ active }) => setActiveTask((active.data.current?.task as Task) ?? null)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="space-y-4 px-4 pb-8 md:px-6">
        {data.sprints.map((sprint) => {
          const { done, total } = sprintProgress(sprint.tasks);
          const range = sprintDateRange(sprint);
          return (
            <Section
              key={sprint.id}
              sprintId={sprint.id}
              highlight={sprint.state === 'active'}
              header={
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{sprint.name}</h3>
                      <Badge variant={sprint.state === 'active' ? 'default' : 'secondary'}>{SPRINT_STATE_LABELS[sprint.state]}</Badge>
                      <span className="text-muted-foreground text-xs">
                        {done}/{total} việc xong
                      </span>
                      {range && (
                        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                          <CalendarRange className="size-3.5" aria-hidden /> {range}
                        </span>
                      )}
                    </div>
                    {sprint.goal && (
                      <p className="text-muted-foreground mt-0.5 flex items-start gap-1 text-xs">
                        <Target className="mt-0.5 size-3 shrink-0" aria-hidden /> {sprint.goal}
                      </p>
                    )}
                  </div>
                  {canManage && sprint.state === 'planned' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={hasActive}
                      title={hasActive ? 'Hoàn thành sprint đang chạy trước' : undefined}
                      onClick={() => setFormSprint({ sprint, mode: 'start' })}
                    >
                      <CirclePlay /> Bắt đầu sprint
                    </Button>
                  )}
                  {canManage && sprint.state === 'active' && (
                    <Button size="sm" onClick={() => setCompleting(sprint)}>
                      Hoàn thành sprint
                    </Button>
                  )}
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Tùy chọn ${sprint.name}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setFormSprint({ sprint, mode: 'edit' })}>
                          <Pencil /> Sửa tên, ngày, mục tiêu
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={sprint.state !== 'planned'}
                          onSelect={() => actions.remove.mutate(sprint.id)}
                        >
                          <Trash2 /> Xóa sprint (việc trở về backlog)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              }
              empty="Kéo công việc từ backlog vào đây để lên kế hoạch cho sprint"
              count={sprint.tasks.length}
              quickAdd={canEdit ? <QuickAdd projectId={projectId} sprintId={sprint.id} /> : null}
            >
              {renderRows(sprint.tasks)}
            </Section>
          );
        })}

        <Section
          sprintId={null}
          header={
            <>
              <h3 className="flex-1 font-semibold">
                Backlog <span className="text-muted-foreground text-sm font-normal">({data.backlog.length} việc)</span>
              </h3>
              {canManage && (
                <Button size="sm" variant="outline" onClick={() => actions.create.mutate({})} disabled={actions.create.isPending}>
                  <Plus /> Tạo sprint
                </Button>
              )}
            </>
          }
          empty="Backlog trống. Thêm công việc mới hoặc kéo việc từ sprint về đây."
          count={data.backlog.length}
          quickAdd={canEdit ? <QuickAdd projectId={projectId} sprintId={null} /> : null}
        >
          {renderRows(data.backlog)}
        </Section>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && <BacklogTaskRowView task={activeTask} column={columnsById.get(activeTask.columnId)} overlay />}
      </DragOverlay>

      <SprintFormDialog
        projectId={projectId}
        sprint={formSprint?.sprint ?? null}
        mode={formSprint?.mode ?? 'edit'}
        onOpenChange={(open) => !open && setFormSprint(null)}
      />
      <CompleteSprintDialog
        projectId={projectId}
        sprint={completing}
        plannedSprints={plannedSprints}
        onOpenChange={(open) => !open && setCompleting(null)}
      />
    </DndContext>
  );
}

function Section({
  sprintId,
  header,
  children,
  empty,
  count,
  quickAdd,
  highlight,
}: {
  sprintId: string | null;
  header: React.ReactNode;
  children: React.ReactNode;
  empty: string;
  count: number;
  quickAdd: React.ReactNode;
  highlight?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `section:${sprintId ?? 'backlog'}`, data: { type: 'section', sprintId } });
  return (
    <section className={cn('bg-muted/40 rounded-lg border', highlight && 'border-primary/40')}>
      <header className="flex flex-wrap items-center gap-2 px-3 py-2.5">{header}</header>
      <ul ref={setNodeRef} className={cn('divide-y border-t', isOver && 'bg-accent/50')}>
        {children}
        {count === 0 && <li className="text-muted-foreground px-3 py-4 text-center text-xs">{empty}</li>}
      </ul>
      {quickAdd}
    </section>
  );
}

function QuickAdd({ projectId, sprintId }: { projectId: string; sprintId: string | null }) {
  const [title, setTitle] = useState('');
  const create = useCreateBacklogTask(projectId);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setTitle('');
    create.mutate({ title: value, sprintId });
  };
  return (
    <form onSubmit={submit} className="border-t p-2">
      <Input
        value={title}
        maxLength={255}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={sprintId ? '+ Thêm công việc vào sprint, nhấn Enter' : '+ Thêm công việc vào backlog, nhấn Enter'}
        aria-label={sprintId ? 'Thêm công việc vào sprint' : 'Thêm công việc vào backlog'}
        className="h-8 border-transparent bg-transparent shadow-none focus-visible:border-input"
      />
    </form>
  );
}
