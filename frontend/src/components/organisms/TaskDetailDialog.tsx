import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Eye, EyeOff, Link2, Trash2 } from 'lucide-react';
import type { Board, RichDoc, Task, TaskType, User } from '@/domain/entities';
import {
  CANNOT_MOVE_HINT,
  canChangeColumn,
  canEditTasks,
  canManageProject,
  canMoveTask,
  canParticipate,
  ONLY_MANAGER_COMPLETES_HINT,
} from '@/domain/rules/permissions';
import { isOverdue, TASK_TYPE_LABELS } from '@/domain/rules/task.rules';
import { useBoard } from '@/application/board/useBoard';
import { notify } from '@/application/notify';
import { useLabels, useMembers } from '@/application/projects/useProjects';
import { LabelPicker } from '@/components/molecules/LabelPicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityList } from './ActivityList';
import { ReturnTaskDialog } from './ReturnTaskDialog';
import { useDeleteTask, useTask, useUpdateTask } from '@/application/tasks/useTasks';
import { useAttachmentMutations, useWatchTask } from '@/application/tasks/useTaskExtras';
import { inlineUrl } from '@/infrastructure/api/attachment.api';
import { PageSpinner } from '@/components/atoms/Spinner';
import { TaskKey } from '@/components/atoms/TaskKey';
import { TaskTypeIcon } from '@/components/atoms/TaskTypeIcon';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { AssigneePicker } from '@/components/molecules/AssigneePicker';
import { DueDatePicker } from '@/components/molecules/DueDatePicker';
import { InlineEditText } from '@/components/molecules/InlineEditText';
import { PrioritySelect } from '@/components/molecules/PrioritySelect';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { displayName } from '@/domain/rules/user.rules';
import { formatDateTime } from '@/lib/date';
import { AttachmentList } from './AttachmentList';
import { CommentSection } from './CommentSection';
import { RichTextEditor, type MentionItem } from './RichTextEditor';
import { SubtaskList } from './SubtaskList';

interface TaskDetailDialogProps {
  taskKey: string | null;
  currentUser: User;
  onClose: () => void;
}

/** TSK-04: chi tiết công việc mở dạng cửa sổ, có link riêng (?task=KEY). */
export function TaskDetailDialog({ taskKey, currentUser, onClose }: TaskDetailDialogProps) {
  const { data, isLoading, isError } = useTask(taskKey);

  return (
    <Dialog open={!!taskKey} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        {isLoading && <PageSpinner />}
        {isError && (
          <div className="p-6">
            <DialogTitle>Không mở được công việc</DialogTitle>
            <DialogDescription className="mt-2">Công việc không tồn tại hoặc bạn không có quyền xem.</DialogDescription>
          </div>
        )}
        {data && (
          <TaskDetail task={data.task} role={data.role} watching={data.watching} currentUser={currentUser} onDeleted={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TaskDetail({
  task,
  role,
  watching,
  currentUser,
  onDeleted,
}: {
  task: Task;
  role: Parameters<typeof canEditTasks>[0];
  watching: boolean;
  currentUser: User;
  onDeleted: () => void;
}) {
  const archived = !!task.project?.archivedAt;
  const canEdit = canEditTasks(role) && !archived;
  // Thành viên: chỉ bình luận / đính kèm tệp / đổi trạng thái việc được giao cho mình.
  const canJoin = canParticipate(role, currentUser.id, task) && !archived;
  const canMove = canMoveTask(role, currentUser.id, task) && !archived;
  const canManage = canManageProject(role);
  const canDelete = canEdit && (canManage || task.creatorId === currentUser.id);
  const update = useUpdateTask(task);
  const deleteTask = useDeleteTask();
  const { data: members = [] } = useMembers(task.projectId);
  const { data: labels = [] } = useLabels(task.projectId);
  const { data: boardView } = useBoard(task.projectId);
  const watch = useWatchTask(task.key);
  const { upload } = useAttachmentMutations(task.key);
  // RTE-06: mọi thành viên dự án đều có thể được @nhắc để đọc.
  const mentionables = useMemo<MentionItem[]>(
    () =>
      members
        .filter((m) => m.user.status !== 'disabled')
        .map((m) => ({ id: m.userId, label: displayName(m.user), email: m.user.email, avatarUrl: m.user.avatarUrl })),
    [members],
  );
  // RTE-05: ảnh dán vào được lưu như tệp đính kèm của công việc.
  const uploadImage = async (file: File) => {
    const [attachment] = await upload.mutateAsync([file]);
    return inlineUrl(attachment);
  };
  const [description, setDescription] = useState<RichDoc | null>(task.description ?? null);
  const [descriptionDirty, setDescriptionDirty] = useState(false);

  useEffect(() => {
    if (!descriptionDirty) setDescription(task.description ?? null);
  }, [task.description, descriptionDirty]);

  const saveDescription = () => {
    if (!descriptionDirty) return;
    update.mutate({ description }, { onSuccess: () => setDescriptionDirty(false) });
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?task=${task.key}`;
    await navigator.clipboard.writeText(url);
    notify.success('Đã sao chép link công việc');
  };

  return (
    <div className="grid md:grid-cols-[1fr_260px]">
      <div className="min-w-0 space-y-6 p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 pr-8">
            <TaskTypeIcon type={task.type} />
            <TaskKey value={task.key} />
            {task.project && <span className="text-muted-foreground truncate text-xs">· {task.project.name}</span>}
          </div>
          <DialogTitle asChild>
            <div className="text-xl font-semibold">
              <InlineEditText
                value={task.title}
                disabled={!canEdit}
                ariaLabel="Tiêu đề"
                onSave={(title) => update.mutate({ title })}
                className="w-full"
              />
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">Chi tiết công việc {task.key}</DialogDescription>
        </div>

        <section className="space-y-2" aria-label="Mô tả">
          <h3 className="text-sm font-semibold">Mô tả</h3>
          {canEdit ? (
            <div onBlur={saveDescription}>
              <RichTextEditor
                value={description}
                onChange={(doc) => {
                  setDescription(doc);
                  // TipTap có thể phát onUpdate khi khởi tạo → chỉ coi là "đã sửa" khi nội dung khác bản đã lưu.
                  setDescriptionDirty(JSON.stringify(doc) !== JSON.stringify(task.description ?? null));
                }}
                placeholder="Thêm mô tả chi tiết... Gõ @ để nhắc tên, dán ảnh bằng Ctrl+V"
                className="min-h-32"
                mentionables={mentionables}
                onUploadImage={uploadImage}
              />
              {descriptionDirty && (
                <p className="text-muted-foreground mt-1 text-xs">Tự lưu khi bấm ra ngoài ô soạn thảo</p>
              )}
            </div>
          ) : task.description ? (
            <RichTextEditor value={task.description} editable={false} />
          ) : (
            <p className="text-muted-foreground text-sm">Chưa có mô tả.</p>
          )}
        </section>

        <SubtaskList task={task} members={members} canEdit={canEdit} />

        <AttachmentList taskKey={task.key} currentUser={currentUser} canUpload={canJoin} canModerate={canManage} />

        {/* CMT-03: chuyển xem Bình luận / Lịch sử */}
        <Tabs defaultValue="comments">
          <TabsList>
            <TabsTrigger value="comments">Bình luận</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
          </TabsList>
          <TabsContent value="comments" className="pt-3">
            <CommentSection
              taskKey={task.key}
              currentUser={currentUser}
              canComment={canJoin}
              canModerate={canManage}
              mentionables={mentionables}
              onUploadImage={uploadImage}
            />
          </TabsContent>
          <TabsContent value="history" className="pt-3">
            <ActivityList taskKey={task.key} />
          </TabsContent>
        </Tabs>
      </div>

      <aside className="bg-muted/40 space-y-4 border-t p-6 md:border-t-0 md:border-l" aria-label="Thông tin công việc">
        <StatusSelect
          task={task}
          board={boardView?.board}
          disabled={!canMove}
          hint={role === 'member' && !archived && !canMove ? CANNOT_MOVE_HINT : undefined}
          canSelect={(column) => canChangeColumn(role, task.column ?? null, column)}
          onChange={(columnId) => update.mutate({ columnId })}
        />
        {canEdit && boardView?.board && (
          <ReturnTaskDialog task={task} columns={[...boardView.board.columns].sort((a, b) => a.position - b.position)} />
        )}
        <Field label="Người làm">
          <AssigneePicker
            members={members}
            value={task.assignee}
            disabled={!canEdit}
            onChange={(assigneeId) => update.mutate({ assigneeId })}
          />
        </Field>
        <Field label="Hạn">
          <DueDatePicker
            value={task.dueDate}
            overdue={isOverdue(task)}
            disabled={!canEdit}
            onChange={(dueDate) => update.mutate({ dueDate })}
          />
        </Field>
        <Field label="Ưu tiên">
          <PrioritySelect value={task.priority} disabled={!canEdit} onChange={(priority) => update.mutate({ priority })} />
        </Field>
        <Field label="Nhãn">
          <LabelPicker options={labels} value={task.labels} disabled={!canEdit} onChange={(labelIds) => update.mutate({ labelIds })} />
        </Field>
        <Field label="Sprint">
          <span className="text-muted-foreground block px-2 text-sm">
            {task.sprint ? task.sprint.name : 'Backlog'}
            {task.sprint?.state === 'active' && <span className="text-primary"> · đang chạy</span>}
          </span>
        </Field>
        <Field label="Loại">
          <Select value={task.type} disabled={!canEdit} onValueChange={(type) => update.mutate({ type: type as TaskType })}>
            <SelectTrigger size="sm" className="w-full" aria-label="Loại công việc">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['task', 'bug'] as const).map((t) => (
                <SelectItem key={t} value={t}>
                  <TaskTypeIcon type={t} /> {TASK_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Người tạo">
          <span className="flex items-center gap-2 px-2 text-sm">
            <UserAvatar user={task.creator} size="sm" /> {displayName(task.creator)}
          </span>
        </Field>

        <div className="text-muted-foreground space-y-1 border-t pt-4 text-xs">
          <p>Tạo lúc {formatDateTime(task.createdAt)}</p>
          <p>Cập nhật {formatDateTime(task.updatedAt)}</p>
          {task.completedAt && <p>Hoàn thành {formatDateTime(task.completedAt)}</p>}
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          <Button
            variant={watching ? 'secondary' : 'outline'}
            size="sm"
            disabled={watch.isPending}
            onClick={() => watch.mutate(!watching)}
            title="Người theo dõi nhận thông báo khi có bình luận hoặc đổi trạng thái"
          >
            {watching ? <EyeOff /> : <Eye />} {watching ? 'Bỏ theo dõi' : 'Theo dõi'}
          </Button>
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Link2 /> Sao chép link
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                deleteTask(task);
                onDeleted();
              }}
            >
              <Trash2 /> Xóa công việc
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground px-2 text-xs font-medium">{label}</p>
      {children}
    </div>
  );
}

function StatusSelect({
  task,
  board,
  disabled,
  hint,
  canSelect,
  onChange,
}: {
  task: Task;
  board?: Board;
  disabled: boolean;
  hint?: string;
  canSelect: (column: Pick<Board['columns'][number], 'id' | 'isDone'>) => boolean;
  onChange: (columnId: string) => void;
}) {
  const columns = board ? [...board.columns].sort((a, b) => a.position - b.position) : task.column ? [task.column] : [];
  const restricted = !disabled && columns.some((c) => !canSelect(c));
  return (
    <Field label="Trạng thái">
      <Select value={task.columnId} disabled={disabled || !board} onValueChange={onChange}>
        <SelectTrigger size="sm" className="w-full" aria-label="Trạng thái">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {columns.map((c) => (
            <SelectItem key={c.id} value={c.id} disabled={!canSelect(c)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(hint ?? (restricted ? ONLY_MANAGER_COMPLETES_HINT : undefined)) && (
        <p className="text-muted-foreground px-2 text-xs">{hint ?? ONLY_MANAGER_COMPLETES_HINT}</p>
      )}
    </Field>
  );
}
