import { useState } from 'react';
import { Search } from 'lucide-react';
import type { BoardColumn, ProjectMember, Task, TaskPriority, TaskType } from '@/domain/entities';
import { DUE_FILTER_LABELS, PRIORITIES, PRIORITY_LABELS, TASK_TYPE_LABELS, type DueFilter } from '@/domain/rules/task.rules';
import { displayName } from '@/domain/rules/user.rules';
import { useLabels } from '@/application/projects/useProjects';
import { useTaskList } from '@/application/tasks/useTasks';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { PriorityIcon } from '@/components/atoms/PriorityIcon';
import { TaskTypeIcon } from '@/components/atoms/TaskTypeIcon';
import { FilterMenu } from '@/components/molecules/FilterMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskTable, type SortField } from '../TaskTable';

const PAGE_SIZE = 25;

interface ListViewProps {
  projectId: string;
  columns: BoardColumn[];
  members: ProjectMember[];
  onOpen: (task: Task) => void;
}

const csv = (values: string[]) => (values.length ? values.join(',') : undefined);

/** SRC-01..02: dạng Danh sách — tìm, lọc, sắp xếp, phân trang; mọi thứ xử lý ở backend. */
export function ListView({ projectId, columns, members, onOpen }: ListViewProps) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortField>('updatedAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [q, setQ] = useState('');
  const [assignee, setAssignee] = useState<string | null>(null);
  const [columnIds, setColumnIds] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [type, setType] = useState<string | null>(null);
  const [due, setDue] = useState<string | null>(null);
  const { data: labels = [] } = useLabels(projectId);
  const keyword = useDebouncedValue(q.trim());

  const { data, isFetching } = useTaskList(projectId, {
    page,
    pageSize: PAGE_SIZE,
    sort,
    order,
    q: keyword || undefined,
    assignee: assignee ?? undefined,
    columnIds: csv(columnIds),
    priorities: csv(priorities),
    labelIds: csv(labelIds),
    type: (type as TaskType | null) ?? undefined,
    due: (due as DueFilter | null) ?? undefined,
  });

  /** Đổi bộ lọc nào cũng quay về trang 1. */
  const withReset =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };
  const filtering = !!assignee || columnIds.length > 0 || priorities.length > 0 || labelIds.length > 0 || !!type || !!due;
  const clearFilters = () => {
    setAssignee(null);
    setColumnIds([]);
    setPriorities([]);
    setLabelIds([]);
    setType(null);
    setDue(null);
    setPage(1);
  };
  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  const onSort = (field: SortField) => {
    if (field === sort) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(field);
      setOrder(field === 'title' || field === 'dueDate' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  return (
    <div className="space-y-3 px-4 pb-6 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo mã, tiêu đề, mô tả"
            aria-label="Tìm công việc"
            className="h-8 pl-8"
          />
        </div>
        <FilterMenu
          label="Người làm"
          value={assignee}
          onChange={withReset(setAssignee)}
          options={[
            { value: 'me', label: 'Việc của tôi' },
            { value: 'none', label: 'Chưa giao' },
            ...members.map((m) => ({ value: m.userId, label: displayName(m.user) })),
          ]}
        />
        <FilterMenu
          multiple
          label="Trạng thái"
          value={columnIds}
          onChange={withReset(setColumnIds)}
          options={sortedColumns.map((c) => ({ value: c.id, label: c.name }))}
        />
        <FilterMenu
          multiple
          label="Ưu tiên"
          value={priorities}
          onChange={withReset(setPriorities)}
          options={PRIORITIES.map((p) => ({
            value: p,
            label: PRIORITY_LABELS[p],
            icon: <PriorityIcon priority={p as TaskPriority} />,
          }))}
        />
        {labels.length > 0 && (
          <FilterMenu
            multiple
            label="Nhãn"
            value={labelIds}
            onChange={withReset(setLabelIds)}
            options={labels.map((l) => ({
              value: l.id,
              label: l.name,
              icon: <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} aria-hidden />,
            }))}
          />
        )}
        <FilterMenu
          label="Loại"
          value={type}
          onChange={withReset(setType)}
          options={(['task', 'bug'] as TaskType[]).map((t) => ({
            value: t,
            label: TASK_TYPE_LABELS[t],
            icon: <TaskTypeIcon type={t} />,
          }))}
        />
        <FilterMenu
          label="Hạn"
          value={due}
          onChange={withReset(setDue)}
          options={(Object.keys(DUE_FILTER_LABELS) as DueFilter[]).map((d) => ({ value: d, label: DUE_FILTER_LABELS[d] }))}
        />
        {filtering && (
          <Button variant="link" size="sm" onClick={clearFilters}>
            Xóa lọc
          </Button>
        )}
      </div>
      <TaskTable
        tasks={data?.items ?? []}
        columns={columns}
        loading={isFetching}
        sort={sort}
        order={order}
        onSort={onSort}
        onOpen={onOpen}
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.meta.total ?? 0}
        onPage={setPage}
      />
    </div>
  );
}
