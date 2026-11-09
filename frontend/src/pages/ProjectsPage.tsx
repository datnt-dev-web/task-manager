import { useState } from 'react';
import { Archive, FolderPlus, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { ROLE_LABELS } from '@/domain/rules/permissions';
import { useProjects } from '@/application/projects/useProjects';
import { PageSpinner } from '@/components/atoms/Spinner';
import { EmptyState } from '@/components/molecules/EmptyState';
import { CreateProjectDialog } from '@/components/organisms/CreateProjectDialog';
import { PageHeader } from '@/components/templates/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/** PRJ-05: danh sách dự án của tôi; xem dự án đã lưu trữ. */
export function ProjectsPage() {
  const [archived, setArchived] = useState(false);
  const { data: projects, isLoading } = useProjects(archived);
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
            <Button variant="ghost" onClick={() => setArchived((v) => !v)}>
              <Archive /> {archived ? 'Dự án đang hoạt động' : 'Đã lưu trữ'}
            </Button>
            {!archived && <CreateProjectDialog trigger={createButton} />}
          </>
        }
      />
      {isLoading && <PageSpinner />}
      {projects?.length === 0 && (
        <EmptyState
          icon={FolderPlus}
          title={archived ? 'Không có dự án lưu trữ' : 'Chưa có dự án nào'}
          description={archived ? undefined : 'Tạo dự án đầu tiên để bắt đầu giao việc cho nhóm.'}
          action={!archived && <CreateProjectDialog trigger={createButton} />}
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
    </div>
  );
}
