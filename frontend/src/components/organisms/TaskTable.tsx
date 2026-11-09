import { ArrowDown, ArrowUp, ListTodo } from 'lucide-react';
import type { BoardColumn, Task } from '@/domain/entities';
import { displayName } from '@/domain/rules/user.rules';
import { PriorityIcon } from '@/components/atoms/PriorityIcon';
import { Spinner } from '@/components/atoms/Spinner';
import { TaskKey } from '@/components/atoms/TaskKey';
import { TaskTypeIcon } from '@/components/atoms/TaskTypeIcon';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { DueDateBadge } from '@/components/molecules/DueDateBadge';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Button } from '@/components/ui/button';
import { PRIORITY_LABELS } from '@/domain/rules/task.rules';
import { cn } from '@/lib/utils';

export type SortField = 'number' | 'title' | 'priority' | 'dueDate' | 'updatedAt';

interface TaskTableProps {
  tasks: Task[];
  columns: BoardColumn[];
  loading: boolean;
  sort: SortField;
  order: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  onOpen: (task: Task) => void;
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}

const HEADERS: { field?: SortField; label: string; className?: string }[] = [
  { field: 'number', label: 'Mã', className: 'w-24' },
  { field: 'title', label: 'Tiêu đề' },
  { label: 'Trạng thái', className: 'w-32 hidden sm:table-cell' },
  { label: 'Người làm', className: 'w-44 hidden md:table-cell' },
  { field: 'priority', label: 'Ưu tiên', className: 'w-28 hidden md:table-cell' },
  { field: 'dueDate', label: 'Hạn', className: 'w-24' },
];

/** SRC-01: dạng danh sách, bấm tiêu đề cột để sắp xếp, có phân trang. */
export function TaskTable({ tasks, columns, loading, sort, order, onSort, onOpen, page, pageSize, total, onPage }: TaskTableProps) {
  const columnName = (id: string) => columns.find((c) => c.id === id)?.name ?? '';
  const pages = Math.max(1, Math.ceil(total / pageSize));

  if (!loading && tasks.length === 0) {
    return <EmptyState icon={ListTodo} title="Không có công việc phù hợp" description="Thử bỏ bớt bộ lọc hoặc tạo công việc mới." />;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
            <tr>
              {HEADERS.map((h) => (
                <th key={h.label} className={cn('px-3 py-2 font-medium', h.className)}>
                  {h.field ? (
                    <button type="button" className="hover:text-foreground inline-flex items-center gap-1" onClick={() => onSort(h.field!)}>
                      {h.label}
                      {sort === h.field && (order === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                    </button>
                  ) : (
                    h.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn('divide-y', loading && 'opacity-60')}>
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => onOpen(task)}>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-1.5">
                    <TaskTypeIcon type={task.type} />
                    <TaskKey value={task.key} done={!!task.completedAt} />
                  </span>
                </td>
                <td className="max-w-0 truncate px-3 py-2">{task.title}</td>
                <td className="text-muted-foreground hidden px-3 py-2 sm:table-cell">{columnName(task.columnId)}</td>
                <td className="hidden px-3 py-2 md:table-cell">
                  <span className="flex items-center gap-2">
                    <UserAvatar user={task.assignee} size="sm" />
                    <span className={cn('truncate', !task.assignee && 'text-muted-foreground')}>{displayName(task.assignee)}</span>
                  </span>
                </td>
                <td className="hidden px-3 py-2 md:table-cell">
                  <span className="flex items-center gap-1.5">
                    <PriorityIcon priority={task.priority} />
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <DueDateBadge task={task} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span className="flex items-center gap-2">
          {total} công việc {loading && <Spinner className="size-3.5" />}
        </span>
        <span className="flex items-center gap-2">
          <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Trước
          </Button>
          Trang {page}/{pages}
          <Button variant="outline" size="xs" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            Sau
          </Button>
        </span>
      </div>
    </div>
  );
}
