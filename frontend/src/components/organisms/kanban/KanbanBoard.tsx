import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Board, BoardColumn as Column, Task } from '@/domain/entities';
import { neighborsAfterDrop, optimisticPosition, tasksOfColumn } from '@/domain/rules/board.rules';
import { useMoveTask, useReorderColumns } from '@/application/board/useBoard';
import { itemCollision, sortableGroupCollision } from '../dnd/collision';
import { AddColumnButton } from './AddColumnButton';
import { BoardColumn, columnSortId } from './BoardColumn';
import { TaskCardView } from './TaskCard';

interface KanbanBoardProps {
  board: Board;
  tasks: Task[];
  canEdit: boolean;
  /** Công việc này người dùng có được kéo không (theo quyền di chuyển). */
  canMove: (task: Task) => boolean;
  canManage: boolean;
  onOpenTask: (task: Task) => void;
}

type DragData = { type: 'task'; task: Task } | { type: 'column'; column: Column } | { type: 'column-drop'; columnId: string };

const taskCollision = itemCollision({ itemType: 'task', ignoreTypes: ['column'] });
const columnCollision = sortableGroupCollision('column');

/** BRD-03..05: kéo thả thẻ giữa các cột và kéo thả sắp xếp cột; hỗ trợ chuột, cảm ứng, bàn phím. */
export function KanbanBoard({ board, tasks, canEdit, canMove, canManage, onOpenTask }: KanbanBoardProps) {
  const [active, setActive] = useState<DragData | null>(null);
  const moveTask = useMoveTask(board.projectId);
  const reorderColumns = useReorderColumns(board.projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columns = useMemo(() => [...board.columns].sort((a, b) => a.position - b.position), [board.columns]);
  const tasksByColumn = useMemo(
    () => Object.fromEntries(columns.map((c) => [c.id, tasksOfColumn(tasks, c.id)])),
    [columns, tasks],
  );

  const collisionDetection: CollisionDetection = useCallback(
    (args) => (args.active.data.current?.type === 'column' ? columnCollision(args) : taskCollision(args)),
    [],
  );

  const onDragStart = ({ active: a }: DragStartEvent) => setActive((a.data.current as DragData) ?? null);

  const dropColumn = (column: Column, over: DragData) => {
    if (over.type !== 'column' || over.column.id === column.id) return;
    const from = columns.findIndex((c) => c.id === column.id);
    const to = columns.findIndex((c) => c.id === over.column.id);
    reorderColumns.mutate({ boardId: board.id, columnIds: arrayMove(columns, from, to).map((c) => c.id) });
  };

  const dropTask = (task: Task, over: DragData) => {
    if (over.type === 'column' || !canMove(task)) return;
    const targetColumnId = over.type === 'task' ? over.task.columnId : over.columnId;
    const target = tasksByColumn[targetColumnId] ?? [];
    let ordered: Task[];

    if (targetColumnId === task.columnId) {
      if (over.type !== 'task') return;
      ordered = arrayMove(
        target,
        target.findIndex((t) => t.id === task.id),
        target.findIndex((t) => t.id === over.task.id),
      );
    } else {
      const withoutActive = target.filter((t) => t.id !== task.id);
      const index = over.type === 'task' ? withoutActive.findIndex((t) => t.id === over.task.id) : withoutActive.length;
      ordered = [...withoutActive.slice(0, index), task, ...withoutActive.slice(index)];
    }

    const { prevTaskId, nextTaskId } = neighborsAfterDrop(ordered, task.id);
    moveTask.mutate({
      task,
      columnId: targetColumnId,
      prevTaskId,
      nextTaskId,
      optimisticPosition: optimisticPosition(
        ordered.find((t) => t.id === prevTaskId),
        ordered.find((t) => t.id === nextTaskId),
      ),
    });
  };

  const onDragEnd = ({ active: a, over }: DragEndEvent) => {
    setActive(null);
    const dragged = a.data.current as DragData | undefined;
    const target = over?.data.current as DragData | undefined;
    if (!dragged || !target) return;
    if (dragged.type === 'column') dropColumn(dragged.column, target);
    else if (dragged.type === 'task') dropTask(dragged.task, target);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable: 'Nhấn Space để cầm, dùng phím mũi tên để di chuyển, Space để thả, Esc để hủy.',
        },
      }}
    >
      <div className="flex h-full items-start gap-3 overflow-x-auto px-4 pb-4 md:px-6">
        <SortableContext items={columns.map((c) => columnSortId(c.id))} strategy={horizontalListSortingStrategy}>
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              projectId={board.projectId}
              sprintId={board.activeSprint?.id ?? null}
              column={column}
              columns={columns}
              tasks={tasksByColumn[column.id] ?? []}
              canEdit={canEdit}
              canMove={canMove}
              canManage={canManage}
              onOpenTask={onOpenTask}
            />
          ))}
        </SortableContext>
        {canManage && columns.length < 10 && <AddColumnButton projectId={board.projectId} boardId={board.id} />}
      </div>
      <DragOverlay dropAnimation={null}>
        {active?.type === 'task' && <TaskCardView task={active.task} overlay />}
        {active?.type === 'column' && (
          <div className="bg-muted/90 w-72 rotate-1 rounded-lg border p-3 text-xs font-semibold tracking-wide uppercase shadow-lg">
            {active.column.name}
            <span className="text-muted-foreground ml-2">{tasksByColumn[active.column.id]?.length ?? 0}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
