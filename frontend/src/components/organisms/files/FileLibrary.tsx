import { useState } from 'react';
import { Download, FolderOpen, LayoutGrid, List, Search } from 'lucide-react';
import { useSearchParams } from 'react-router';
import type { Attachment, FileKind } from '@/domain/entities';
import { FILE_KIND_LABELS, formatFileSize, isPreviewable } from '@/domain/rules/file.rules';
import { displayName } from '@/domain/rules/user.rules';
import { useFileLibrary } from '@/application/files/useFileLibrary';
import { useProjects } from '@/application/projects/useProjects';
import type { FileLibraryQuery } from '@/infrastructure/api/attachment.api';
import { FileThumb } from '@/components/atoms/FileThumb';
import { Spinner } from '@/components/atoms/Spinner';
import { TaskKey } from '@/components/atoms/TaskKey';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fromNow } from '@/lib/date';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { cn } from '@/lib/utils';
import { FilePreviewDialog } from './FilePreviewDialog';

const PAGE_SIZE = 30;
const KINDS: ('all' | FileKind)[] = ['all', 'image', 'pdf', 'document', 'archive'];
const SORTS: { value: NonNullable<FileLibraryQuery['sort']>; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'name', label: 'Tên A → Z' },
  { value: 'size', label: 'Dung lượng lớn nhất' },
];
const VIEW_KEY = 'tm-files-view';

/**
 * Kho tệp tập trung: xem toàn bộ tệp đính kèm mà không cần mở từng công việc.
 * Mỗi tệp cho biết thuộc công việc nào; bấm là mở đúng công việc đó (?task=KEY).
 * `projectId` cố định → chỉ tệp của một dự án (tab "Tệp" trong dự án).
 */
export function FileLibrary({ projectId }: { projectId?: string }) {
  const [, setSearchParams] = useSearchParams();
  const { data: projects = [] } = useProjects();
  const [q, setQ] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [kind, setKind] = useState<'all' | FileKind>('all');
  const [mine, setMine] = useState(false);
  const [sort, setSort] = useState<NonNullable<FileLibraryQuery['sort']>>('newest');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const debouncedQ = useDebouncedValue(q.trim());

  const effectiveProject = projectId ?? (projectFilter === 'all' ? undefined : projectFilter);
  const { data, isLoading, isFetching } = useFileLibrary({
    q: debouncedQ || undefined,
    projectId: effectiveProject,
    kind: kind === 'all' ? undefined : kind,
    mine: mine || undefined,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });
  const files = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resetPage = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };
  const changeView = (next: 'grid' | 'list') => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* bỏ qua */
    }
  };

  /** Mở đúng công việc chứa tệp — cửa sổ chi tiết công việc mở ngay tại trang hiện tại. */
  const openTask = (attachment: Attachment) => {
    if (!attachment.task) return;
    setPreviewIndex(null);
    setSearchParams((params) => {
      params.set('task', attachment.task!.key);
      return params;
    });
  };

  const open = (index: number) => {
    const file = files[index];
    if (isPreviewable(file.mimeType)) setPreviewIndex(index);
    else window.location.href = file.url;
  };

  // Điều hướng trước/sau trong các tệp xem trước được của trang hiện tại.
  const previewable = files.map((f, i) => (isPreviewable(f.mimeType) ? i : -1)).filter((i) => i >= 0);
  const pos = previewIndex === null ? -1 : previewable.indexOf(previewIndex);
  const hasFilters = !!q || kind !== 'all' || mine || (!projectId && projectFilter !== 'all');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
          <Input
            value={q}
            onChange={(e) => resetPage(setQ)(e.target.value)}
            placeholder="Tìm theo tên tệp"
            aria-label="Tìm theo tên tệp"
            className="h-8 pl-8"
          />
        </div>
        {!projectId && (
          <Select value={projectFilter} onValueChange={resetPage(setProjectFilter)}>
            <SelectTrigger size="sm" className="w-48" aria-label="Lọc theo dự án">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả dự án</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="bg-muted inline-flex rounded-md p-0.5" role="radiogroup" aria-label="Loại tệp">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => resetPage(setKind)(k)}
              className={cn(
                'text-muted-foreground rounded-sm px-2.5 py-1 text-xs font-medium',
                kind === k && 'bg-background text-foreground shadow-sm',
              )}
            >
              {k === 'all' ? 'Tất cả' : FILE_KIND_LABELS[k]}
            </button>
          ))}
        </div>
        <Button variant={mine ? 'secondary' : 'ghost'} size="sm" aria-pressed={mine} onClick={() => resetPage(setMine)(!mine)}>
          Tệp tôi tải lên
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {isFetching && !isLoading && <Spinner className="size-4" />}
          <Select value={sort} onValueChange={(v) => resetPage(setSort)(v as typeof sort)}>
            <SelectTrigger size="sm" className="w-44" aria-label="Sắp xếp">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="bg-muted inline-flex rounded-md p-0.5">
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon-xs" aria-label="Dạng lưới" aria-pressed={view === 'grid'} onClick={() => changeView('grid')}>
              <LayoutGrid />
            </Button>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon-xs" aria-label="Dạng danh sách" aria-pressed={view === 'list'} onClick={() => changeView('list')}>
              <List />
            </Button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}
      {!isLoading && files.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title={hasFilters ? 'Không có tệp phù hợp' : 'Chưa có tệp đính kèm nào'}
          description={hasFilters ? 'Thử bỏ bớt bộ lọc.' : 'Tệp đính kèm trong mọi công việc sẽ được gom về đây.'}
        />
      )}

      {view === 'grid' ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {files.map((file, index) => (
            <li key={file.id} className="bg-card group flex min-w-0 flex-col overflow-hidden rounded-lg border">
              <button
                type="button"
                onClick={() => open(index)}
                className="relative block aspect-[4/3] w-full overflow-hidden"
                aria-label={`Xem ${file.fileName}`}
              >
                <FileThumb attachment={file} className="transition-transform group-hover:scale-105" />
              </button>
              <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                <p className="truncate text-sm font-medium" title={file.fileName}>
                  {file.fileName}
                </p>
                <TaskLink file={file} onOpen={openTask} showProject={!projectId} />
                <p className="text-muted-foreground mt-auto flex items-center gap-1.5 text-xs">
                  <UserAvatar user={file.uploadedBy} size="sm" className="size-4" />
                  <span className="truncate">{formatFileSize(file.size)} · {fromNow(file.createdAt)}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        files.length > 0 && (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
                <tr>
                  <th className="px-3 py-2 font-medium">Tệp</th>
                  <th className="px-3 py-2 font-medium">Thuộc công việc</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Người tải lên</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Dung lượng</th>
                  <th className="hidden px-3 py-2 font-medium lg:table-cell">Thời gian</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {files.map((file, index) => (
                  <tr key={file.id} className="hover:bg-muted/30">
                    <td className="max-w-0 px-3 py-2">
                      <button type="button" onClick={() => open(index)} className="flex w-full min-w-0 items-center gap-2 text-left">
                        <span className="size-8 shrink-0 overflow-hidden rounded">
                          <FileThumb attachment={file} showExtension={false} />
                        </span>
                        <span className="truncate font-medium hover:underline">{file.fileName}</span>
                      </button>
                    </td>
                    <td className="max-w-0 px-3 py-2">
                      <TaskLink file={file} onOpen={openTask} showProject={!projectId} />
                    </td>
                    <td className="hidden px-3 py-2 md:table-cell">
                      <span className="flex items-center gap-2">
                        <UserAvatar user={file.uploadedBy} size="sm" />
                        <span className="truncate">{displayName(file.uploadedBy)}</span>
                      </span>
                    </td>
                    <td className="text-muted-foreground hidden px-3 py-2 sm:table-cell">{formatFileSize(file.size)}</td>
                    <td className="text-muted-foreground hidden px-3 py-2 lg:table-cell">{fromNow(file.createdAt)}</td>
                    <td className="px-2 py-2">
                      <Button variant="ghost" size="icon-xs" asChild>
                        <a href={file.url} aria-label={`Tải xuống ${file.fileName}`}>
                          <Download />
                        </a>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {total > 0 && (
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>{total} tệp</span>
          {pages > 1 && (
            <span className="flex items-center gap-2">
              <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Trước
              </Button>
              Trang {page}/{pages}
              <Button variant="outline" size="xs" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                Sau
              </Button>
            </span>
          )}
        </div>
      )}

      <FilePreviewDialog
        attachment={previewIndex === null ? null : files[previewIndex] ?? null}
        onClose={() => setPreviewIndex(null)}
        onOpenTask={openTask}
        onPrev={pos > 0 ? () => setPreviewIndex(previewable[pos - 1]) : undefined}
        onNext={pos >= 0 && pos < previewable.length - 1 ? () => setPreviewIndex(previewable[pos + 1]) : undefined}
      />
    </div>
  );
}

/** Công việc chứa tệp: bấm để mở đúng công việc. */
function TaskLink({ file, onOpen, showProject }: { file: Attachment; onOpen: (file: Attachment) => void; showProject: boolean }) {
  if (!file.task) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(file)}
      title={`Mở công việc ${file.task.key}: ${file.task.title}`}
      className="hover:bg-muted -mx-1 flex min-w-0 flex-col rounded px-1 py-0.5 text-left"
    >
      <span className="flex min-w-0 items-center gap-1.5 text-xs">
        <TaskKey value={file.task.key} className="text-primary shrink-0" />
        <span className="truncate hover:underline">{file.task.title}</span>
      </span>
      {showProject && (
        <span className="text-muted-foreground flex items-center gap-1 truncate text-[11px]">
          <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: file.task.project.color ?? '#3b82f6' }} aria-hidden />
          {file.task.project.name}
        </span>
      )}
    </button>
  );
}
