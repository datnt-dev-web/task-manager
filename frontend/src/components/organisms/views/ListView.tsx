import { useState } from 'react';
import { Search } from 'lucide-react';
import type { BoardColumn, Task } from '@/domain/entities';
import { useTaskList } from '@/application/tasks/useTasks';
import { Input } from '@/components/ui/input';
import { TaskTable, type SortField } from '../TaskTable';

const PAGE_SIZE = 25;

/** SRC-01..03: dạng Danh sách — tìm theo mã/tiêu đề/mô tả, sắp xếp, phân trang (phía server). */
export function ListView({ projectId, columns, onOpen }: { projectId: string; columns: BoardColumn[]; onOpen: (task: Task) => void }) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortField>('updatedAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [q, setQ] = useState('');
  const { data, isFetching } = useTaskList(projectId, { page, pageSize: PAGE_SIZE, sort, order, q: q.trim() || undefined });

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
