import { AlertTriangle, CircleCheck, UserX } from 'lucide-react';
import type { ProjectOverview } from '@/domain/entities';
import { displayName } from '@/domain/rules/user.rules';
import { useProjectOverview } from '@/application/projects/useProjects';
import { PageSpinner } from '@/components/atoms/Spinner';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { cn } from '@/lib/utils';

const percent = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

/** DSH-02: tổng quan dự án — số việc theo cột, theo người làm, quá hạn, % hoàn thành. */
export function OverviewView({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectOverview(projectId);
  if (isLoading || !data) return <PageSpinner />;

  return (
    <div className="space-y-6 px-4 pb-8 md:px-6">
      <StatTiles data={data} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ByColumn data={data} />
        <ByAssignee data={data} />
      </div>
    </div>
  );
}

function StatTiles({ data }: { data: ProjectOverview }) {
  const donePct = percent(data.done, data.total);
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile label="Tổng công việc" value={data.total} hint={`${data.open} việc đang mở`} />
      <Tile label="Hoàn thành" value={`${donePct}%`} hint={`${data.done}/${data.total} việc`}>
        <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full" aria-hidden>
          <div className="bg-primary h-full rounded-full" style={{ width: `${donePct}%` }} />
        </div>
      </Tile>
      <Tile
        label="Quá hạn"
        value={data.overdue}
        hint={data.overdue > 0 ? 'Cần xử lý gấp' : 'Không có việc quá hạn'}
        icon={data.overdue > 0 ? <AlertTriangle className="text-destructive size-4" aria-hidden /> : undefined}
        tone={data.overdue > 0 ? 'critical' : undefined}
      />
      <Tile
        label="Chưa giao"
        value={data.unassigned}
        hint="Việc đang mở chưa có người làm"
        icon={data.unassigned > 0 ? <UserX className="text-muted-foreground size-4" aria-hidden /> : undefined}
      />
    </dl>
  );
}

function Tile({
  label,
  value,
  hint,
  icon,
  tone,
  children,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon?: React.ReactNode;
  tone?: 'critical';
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('bg-card rounded-lg border p-4', tone === 'critical' && 'border-destructive/40')}>
      <dt className="text-muted-foreground flex items-center gap-1.5 text-sm">
        {icon}
        {label}
      </dt>
      <dd className={cn('mt-1 text-2xl font-semibold tabular-nums', tone === 'critical' && 'text-destructive')}>{value}</dd>
      <dd className="text-muted-foreground text-xs">{hint}</dd>
      {children}
    </div>
  );
}

/** Số việc theo cột: thanh ngang một màu (một chuỗi dữ liệu → không cần chú thích), có số ở cuối thanh. */
function ByColumn({ data }: { data: ProjectOverview }) {
  const max = Math.max(1, ...data.byColumn.map((c) => c.count));
  return (
    <section className="bg-card space-y-3 rounded-lg border p-4" aria-labelledby="ov-columns">
      <h2 id="ov-columns" className="text-sm font-semibold">
        Số việc theo cột
      </h2>
      <ul className="space-y-2.5">
        {data.byColumn.map((c) => (
          <li
            key={c.id}
            className="grid grid-cols-[minmax(0,8rem)_1fr_2.5rem] items-center gap-3"
            title={`${c.name}: ${c.count} việc (${percent(c.count, data.total)}%)`}
          >
            <span className="flex min-w-0 items-center gap-1.5 text-sm">
              {c.isDone && <CircleCheck className="size-3.5 shrink-0 text-green-600 dark:text-green-400" aria-label="Cột Hoàn thành" />}
              <span className="truncate">{c.name}</span>
            </span>
            <span className="bg-muted h-2 overflow-hidden rounded-full" aria-hidden>
              <span className="bg-primary block h-full rounded-full" style={{ width: `${(c.count / max) * 100}%` }} />
            </span>
            <span className="text-right text-sm tabular-nums">{c.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Theo người làm: bảng (đọc được không cần màu) + thanh tiến độ nhỏ. */
function ByAssignee({ data }: { data: ProjectOverview }) {
  return (
    <section className="bg-card space-y-3 rounded-lg border p-4" aria-labelledby="ov-assignees">
      <h2 id="ov-assignees" className="text-sm font-semibold">
        Theo người làm
      </h2>
      {data.byAssignee.length === 0 ? (
        <p className="text-muted-foreground text-sm">Dự án chưa có công việc nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-left text-xs">
              <tr>
                <th className="pb-2 font-medium">Người làm</th>
                <th className="pb-2 text-right font-medium">Đang mở</th>
                <th className="pb-2 text-right font-medium">Quá hạn</th>
                <th className="pb-2 pl-4 font-medium">Hoàn thành</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.byAssignee.map((row) => {
                const total = row.open + row.done;
                const pct = percent(row.done, total);
                return (
                  <tr key={row.user?.id ?? 'none'}>
                    <td className="py-2 pr-2">
                      <span className="flex min-w-0 items-center gap-2">
                        {row.user ? <UserAvatar user={row.user} size="sm" /> : <UserX className="text-muted-foreground size-5" aria-hidden />}
                        <span className={cn('truncate', !row.user && 'text-muted-foreground italic')}>
                          {row.user ? displayName(row.user) : 'Chưa giao'}
                        </span>
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{row.open}</td>
                    <td className={cn('py-2 text-right tabular-nums', row.overdue > 0 && 'text-destructive font-medium')}>
                      {row.overdue > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle className="size-3.5" aria-hidden />
                          {row.overdue}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="py-2 pl-4" title={`${row.done}/${total} việc hoàn thành`}>
                      <span className="flex items-center gap-2">
                        <span className="bg-muted h-1.5 w-16 overflow-hidden rounded-full" aria-hidden>
                          <span className="bg-primary block h-full rounded-full" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="text-muted-foreground text-xs tabular-nums">{pct}%</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
