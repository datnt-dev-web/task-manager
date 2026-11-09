import { lazy, Suspense } from 'react';
import { Archive, ArchiveRestore, CalendarDays, Columns3, List, ListTodo, Paperclip, Tags, Users } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router';
import type { Task } from '@/domain/entities';
import { canEditTasks, canManageProject, canMoveTask } from '@/domain/rules/permissions';
import { useCurrentUser } from '@/application/auth/useCurrentUser';
import { useBoard, useRenameBoard } from '@/application/board/useBoard';
import { useMembers, useUpdateProject } from '@/application/projects/useProjects';
import { getErrorStatus } from '@/infrastructure/http/apiError';
import { PageSpinner } from '@/components/atoms/Spinner';
import { ReadOnlyBadge } from '@/components/atoms/ReadOnlyBadge';
import { EmptyState } from '@/components/molecules/EmptyState';
import { InlineEditText } from '@/components/molecules/InlineEditText';
import { LabelManagerDialog } from '@/components/organisms/LabelManagerDialog';
import { ProjectMembersDialog } from '@/components/organisms/ProjectMembersDialog';
import { BoardView } from '@/components/organisms/views/BoardView';
import { ListView } from '@/components/organisms/views/ListView';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Backlog và Lịch chỉ tải khi mở tab.
const BacklogView = lazy(() => import('@/components/organisms/backlog/BacklogView').then((m) => ({ default: m.BacklogView })));
const CalendarView = lazy(() => import('@/components/organisms/calendar/CalendarView').then((m) => ({ default: m.CalendarView })));
const FileLibrary = lazy(() => import('@/components/organisms/files/FileLibrary').then((m) => ({ default: m.FileLibrary })));

const VIEWS = [
  { value: 'board', label: 'Bảng', icon: Columns3 },
  { value: 'backlog', label: 'Backlog', icon: ListTodo },
  { value: 'list', label: 'Danh sách', icon: List },
  { value: 'calendar', label: 'Lịch', icon: CalendarDays },
  { value: 'files', label: 'Tệp', icon: Paperclip },
] as const;
type View = (typeof VIEWS)[number]['value'];

/** Trang dự án: tiêu đề + chuyển dạng xem Bảng / Backlog / Danh sách / Lịch (lưu trên URL ?view=). */
export function BoardPage() {
  const user = useCurrentUser();
  const { projectId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('view');
  const view: View = VIEWS.some((v) => v.value === requested) ? (requested as View) : 'board';
  const { data, isLoading, error } = useBoard(projectId);
  const { data: members = [] } = useMembers(projectId);
  const renameBoard = useRenameBoard(projectId);
  const updateProject = useUpdateProject(projectId);

  if (isLoading) return <PageSpinner />;
  if (error || !data) {
    return (
      <EmptyState
        icon={Columns3}
        title={getErrorStatus(error) === 404 ? 'Không tìm thấy dự án' : 'Không tải được dự án'}
        description="Dự án không tồn tại hoặc bạn không phải thành viên."
      />
    );
  }

  const { board, role } = data;
  const archived = !!board.project.archivedAt;
  const canEdit = canEditTasks(role) && !archived;
  const canManage = canManageProject(role) && !archived;
  const canMove = (task: Task) => !archived && canMoveTask(role, user.id, task);

  const openTask = (task: Task) =>
    setSearchParams((params) => {
      params.set('task', task.key);
      return params;
    });
  const setView = (next: string) =>
    setSearchParams((params) => {
      if (next === 'board') params.delete('view');
      else params.set('view', next);
      return params;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 px-4 pt-4 pb-3 md:px-6">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>{board.project.name}</span>
          <span>·</span>
          <span>{board.project.key}</span>
          {archived && <span className="text-amber-600 dark:text-amber-400">· Đã lưu trữ</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 text-xl font-semibold">
            <InlineEditText
              value={board.name}
              maxLength={100}
              disabled={!canManage}
              ariaLabel="Tên bảng"
              onSave={(name) => renameBoard.mutate({ boardId: board.id, name })}
            />
          </h1>
          {!canEditTasks(role) && <ReadOnlyBadge />}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {canManage && (
              <LabelManagerDialog
                projectId={projectId}
                trigger={
                  <Button variant="outline" size="sm">
                    <Tags /> Nhãn
                  </Button>
                }
              />
            )}
            <ProjectMembersDialog
              projectId={projectId}
              canManage={canManage}
              trigger={
                <Button variant="outline" size="sm">
                  <Users /> Thành viên
                </Button>
              }
            />
            {canManageProject(role) && (
              <Button variant="ghost" size="sm" onClick={() => updateProject.mutate({ archived: !archived })}>
                {archived ? <ArchiveRestore /> : <Archive />}
                {archived ? 'Khôi phục' : 'Lưu trữ'}
              </Button>
            )}
          </div>
        </div>
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            {VIEWS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value}>
                <Icon /> {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Suspense fallback={<PageSpinner />}>
        {view === 'board' && (
          <BoardView
            board={board}
            members={members}
            currentUserId={user.id}
            canEdit={canEdit}
            canMove={canMove}
            canManage={canManage}
            onOpenTask={openTask}
            onGoToBacklog={() => setView('backlog')}
          />
        )}
        {view === 'backlog' && <BacklogView projectId={projectId} canEdit={canEdit} canMove={canMove} canManage={canManage} onOpenTask={openTask} />}
        {view === 'list' && <ListView projectId={projectId} columns={board.columns} onOpen={openTask} />}
        {view === 'calendar' && <CalendarView projectId={projectId} canEdit={canEdit} canMove={canMove} onOpenTask={openTask} />}
        {view === 'files' && (
          <div className="px-4 pb-8 md:px-6">
            <FileLibrary projectId={projectId} />
          </div>
        )}
      </Suspense>
    </div>
  );
}
