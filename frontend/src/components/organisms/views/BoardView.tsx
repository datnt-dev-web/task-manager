import { useMemo, useState } from 'react';
import { CalendarRange, Search, Target } from 'lucide-react';
import type { Board, ProjectMember, Task } from '@/domain/entities';
import { sprintDateRange, sprintDaysLeft } from '@/domain/rules/sprint.rules';
import { displayName } from '@/domain/rules/user.rules';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { KanbanBoard } from '../kanban/KanbanBoard';

interface BoardViewProps {
  board: Board;
  members: ProjectMember[];
  currentUserId: string;
  canEdit: boolean;
  canMove: (task: Task) => boolean;
  canManage: boolean;
  onOpenTask: (task: Task) => void;
  onGoToBacklog: () => void;
}

/** Dạng Bảng: bộ lọc nhanh (BRD-08) + Kanban; có sprint đang chạy thì hiện thanh thông tin sprint. */
export function BoardView({ board, members, currentUserId, canEdit, canMove, canManage, onOpenTask, onGoToBacklog }: BoardViewProps) {
  const [q, setQ] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  const tasks = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return board.tasks.filter((t) => {
      if (onlyMine && t.assigneeId !== currentUserId) return false;
      if (assigneeIds.length && !assigneeIds.includes(t.assigneeId ?? '')) return false;
      if (keyword && !t.title.toLowerCase().includes(keyword) && !t.key.toLowerCase().includes(keyword)) return false;
      return true;
    });
  }, [board.tasks, q, onlyMine, assigneeIds, currentUserId]);

  const toggleAssignee = (id: string) =>
    setAssigneeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const sprint = board.activeSprint;
  const daysLeft = sprint ? sprintDaysLeft(sprint) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {sprint && (
        <div className="bg-primary/5 border-primary/20 mx-4 mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border px-3 py-2 text-sm md:mx-6">
          <span className="font-semibold">{sprint.name}</span>
          {sprintDateRange(sprint) && (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <CalendarRange className="size-3.5" aria-hidden /> {sprintDateRange(sprint)}
            </span>
          )}
          {daysLeft !== null && (
            <span className={cn('text-xs', daysLeft < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
              {daysLeft < 0 ? `Quá ${-daysLeft} ngày` : daysLeft === 0 ? 'Kết thúc hôm nay' : `Còn ${daysLeft} ngày`}
            </span>
          )}
          {sprint.goal && (
            <span className="text-muted-foreground inline-flex min-w-0 items-center gap-1 text-xs">
              <Target className="size-3.5 shrink-0" aria-hidden /> <span className="truncate">{sprint.goal}</span>
            </span>
          )}
          <Button variant="link" size="sm" className="ml-auto h-auto p-0" onClick={onGoToBacklog}>
            {canManage ? 'Quản lý sprint' : 'Xem backlog'}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-4 pb-3 md:px-6">
        <div className="relative w-full sm:w-56">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo mã, tiêu đề" aria-label="Tìm công việc trên bảng" className="h-8 pl-8" />
        </div>
        <div className="flex -space-x-1.5" role="group" aria-label="Lọc theo người làm">
          {members
            .filter((m) => m.role !== 'viewer')
            .slice(0, 8)
            .map((m) => (
              <button
                key={m.userId}
                type="button"
                aria-pressed={assigneeIds.includes(m.userId)}
                title={displayName(m.user)}
                onClick={() => toggleAssignee(m.userId)}
                className={cn(
                  'ring-background rounded-full ring-2 transition-transform hover:z-10 hover:-translate-y-0.5',
                  assigneeIds.includes(m.userId) && 'ring-primary z-10',
                )}
              >
                <UserAvatar user={m.user} size="sm" />
              </button>
            ))}
        </div>
        <Button variant={onlyMine ? 'secondary' : 'ghost'} size="sm" aria-pressed={onlyMine} onClick={() => setOnlyMine((v) => !v)}>
          Việc của tôi
        </Button>
        {(q || onlyMine || assigneeIds.length > 0) && (
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setQ('');
              setOnlyMine(false);
              setAssigneeIds([]);
            }}
          >
            Xóa lọc
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <KanbanBoard board={board} tasks={tasks} canEdit={canEdit} canMove={canMove} canManage={canManage} onOpenTask={onOpenTask} />
      </div>
    </div>
  );
}
