import { useState } from 'react';
import { Archive, FolderPlus, Plus, Search } from 'lucide-react';
import { Link } from 'react-router';
import { ROLE_LABELS } from '@/domain/rules/permissions';
import { useProjectPage } from '@/application/projects/useProjects';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { Pagination } from '@/components/molecules/Pagination';
import { Input } from '@/components/ui/input';
import { PageSpinner } from '@/components/atoms/Spinner';
import { EmptyState } from '@/components/molecules/EmptyState';
import { useCurrentUser } from '@/application/auth/useCurrentUser';
import { CreateProjectDialog } from '@/components/organisms/CreateProjectDialog';
import { PageHeader } from '@/components/templates/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 12;

/** PRJ-05: danh sách dự án của tôi (phân trang + tìm kiếm ở backend); xem dự án đã lưu trữ. */
export function ProjectsPage() {
  const [archived, setArchived] = useState(false);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(q.trim());
  const { data, isLoading } = useProjectPage({ archived, q: search, page, pageSize: PAGE_SIZE });
  const projects = data?.items;
  // Chỉ Quản trị viên được tạo dự án.
  const canCreate = useCurrentUser().isAdmin && !archived;
  const createButton = (
    <Button>
      <Plus /> Tạo dự án
    </Button>
  );

  return (
    <div className="mx-auto w-full max-w-5xl pb-10">
      <PageHeader
        title={archived ? 'Dự án đã lưu trữ' : 'Tất cả dự án'}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setArchived((v) => !v);
                setPage(1);
              }}
            >
              <Archive /> {archived ? 'Dự án đang hoạt động' : 'Đã lưu trữ'}
            </Button>
            {canCreate && <CreateProjectDialog trigger={createButton} />}
          </>
        }
      />
      <div className="px-4 pb-4 md:px-6">
        <div className="relative sm:w-80">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên hoặc mã dự án"
            aria-label="Tìm dự án"
            className="pl-8"
          />
        </div>
      </div>
      {isLoading && <PageSpinner />}
      {projects?.length === 0 && search && (
        <p className="text-muted-foreground px-4 text-sm md:px-6">Không tìm thấy dự án phù hợp.</p>
      )}
      {projects?.length === 0 && !search && (
        <EmptyState
          icon={FolderPlus}
          title={archived ? 'Không có dự án lưu trữ' : 'Chưa có dự án nào'}
          description={
            archived
              ? undefined
              : canCreate
                ? 'Tạo dự án đầu tiên để bắt đầu giao việc cho nhóm.'
                : 'Bạn chưa được thêm vào dự án nào. Hãy liên hệ quản trị viên.'
          }
          action={canCreate && <CreateProjectDialog trigger={createButton} />}
        />
      )}
      <div className="grid gap-3 px-4 sm:grid-cols-2 md:px-6 lg:grid-cols-3">
        {projects?.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="bg-card hover:border-ring flex items-center gap-3 rounded-lg border p-4 transition-colors"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white"
              style={{ backgroundColor: project.color ?? '#3b82f6' }}
              aria-hidden
            >
              {project.key.slice(0, 2)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{project.name}</span>
              <span className="text-muted-foreground text-xs">{project.key}</span>
            </span>
            <Badge variant="secondary">{ROLE_LABELS[project.role]}</Badge>
          </Link>
        ))}
      </div>
      {data && (
        <Pagination
          className="px-4 pt-4 md:px-6"
          page={data.meta.page}
          pageSize={data.meta.pageSize}
          total={data.meta.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
