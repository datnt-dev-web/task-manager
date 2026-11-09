import { useMemo } from 'react';
import { CircleCheckBig } from 'lucide-react';
import { useSearchParams } from 'react-router';
import type { Task } from '@/domain/entities';
import { useCurrentUser } from '@/application/auth/useCurrentUser';
import { DUE_GROUP_LABELS, groupByDue, type DueGroup } from '@/domain/rules/task.rules';
import { displayName } from '@/domain/rules/user.rules';
import { useMyTasks } from '@/application/tasks/useTasks';
import { PageSpinner } from '@/components/atoms/Spinner';
import { PriorityIcon } from '@/components/atoms/PriorityIcon';
import { TaskKey } from '@/components/atoms/TaskKey';
import { TaskTypeIcon } from '@/components/atoms/TaskTypeIcon';
import { DueDateBadge } from '@/components/molecules/DueDateBadge';
import { EmptyState } from '@/components/molecules/EmptyState';
import { PageHeader } from '@/components/templates/PageHeader';
import { cn } from '@/lib/utils';

const ORDER: DueGroup[] = ['overdue', 'today', 'thisWeek', 'later', 'noDate'];

/** DSH-01: trang chủ sau đăng nhập — việc chưa xong của tôi, nhóm theo hạn. */
export function MyWorkPage() {
  const user = useCurrentUser();
  const { data: tasks, isLoading } = useMyTasks();
  const [, setSearchParams] = useSearchParams();
  const groups = useMemo(() => groupByDue(tasks ?? []), [tasks]);

  const open = (task: Task) =>
    setSearchParams((params) => {
      params.set('task', task.key);
      return params;
    });

  return (
    <div className="mx-auto w-full max-w-4xl pb-10">
      <PageHeader
        title={`Xin chào, ${displayName(user)}`}
        description={tasks ? `Bạn có ${tasks.length} việc chưa hoàn thành` : undefined}
      />
      {isLoading && <PageSpinner />}
      {tasks?.length === 0 && (
        <EmptyState icon={CircleCheckBig} title="Bạn không còn việc nào" description="Việc được giao cho bạn sẽ hiện ở đây." />
      )}
      <div className="space-y-6 px-4 md:px-6">
        {ORDER.filter((g) => groups[g].length > 0).map((group) => (
          <section key={group} aria-label={DUE_GROUP_LABELS[group]}>
            <h2
              className={cn(
                'mb-2 text-sm font-semibold',
                group === 'overdue' && 'text-red-600 dark:text-red-400',
              )}
            >
              {DUE_GROUP_LABELS[group]} <span className="text-muted-foreground font-normal">({groups[group].length})</span>
            </h2>
            <ul className="bg-card divide-y rounded-lg border">
              {groups[group].map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => open(task)}
                    className="hover:bg-muted/50 flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm"
                  >
                    <TaskTypeIcon type={task.type} />
                    <TaskKey value={task.key} className="w-16 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{task.title}</span>
                    <span className="text-muted-foreground hidden truncate text-xs sm:inline">{task.project?.name}</span>
                    <span className="bg-muted hidden rounded px-1.5 py-0.5 text-xs md:inline">{task.column?.name}</span>
                    <DueDateBadge task={task} className="w-14" />
                    <PriorityIcon priority={task.priority} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
