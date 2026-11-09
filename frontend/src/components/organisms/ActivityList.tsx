import { ArrowRight, History } from 'lucide-react';
import { describeActivity } from '@/domain/rules/activity.rules';
import { displayName } from '@/domain/rules/user.rules';
import { useActivity } from '@/application/tasks/useActivityAndCalendar';
import { Spinner } from '@/components/atoms/Spinner';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { EmptyState } from '@/components/molecules/EmptyState';
import { formatDateTime, fromNow } from '@/lib/date';

/** TSK-09: lịch sử thay đổi — ai, khi nào, trường nào, cũ → mới. */
export function ActivityList({ taskKey }: { taskKey: string }) {
  const { data, isLoading } = useActivity(taskKey);

  if (isLoading) return <Spinner />;
  if (!data?.length) return <EmptyState icon={History} title="Chưa có thay đổi nào" className="py-6" />;

  return (
    <ol className="space-y-3" aria-label="Lịch sử thay đổi">
      {data.map((entry) => {
        const { summary, change } = describeActivity(entry);
        return (
          <li key={entry.id} className="flex gap-3 text-sm">
            <UserAvatar user={entry.actor} size="sm" />
            <div className="min-w-0 flex-1">
              <p>
                <span className="font-medium">{entry.actor ? displayName(entry.actor) : 'Hệ thống'}</span> {summary}{' '}
                <time className="text-muted-foreground text-xs" title={formatDateTime(entry.createdAt)}>
                  · {fromNow(entry.createdAt)}
                </time>
              </p>
              {change && (
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 line-through">{change.from}</span>
                  <ArrowRight className="text-muted-foreground size-3" aria-label="thành" />
                  <span className="bg-primary/10 rounded px-1.5 py-0.5">{change.to}</span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
