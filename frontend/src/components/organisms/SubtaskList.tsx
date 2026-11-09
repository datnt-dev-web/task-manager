import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ProjectMember, Subtask, Task } from '@/domain/entities';
import { isOverdue } from '@/domain/rules/task.rules';
import { useSubtaskMutations } from '@/application/tasks/useTaskExtras';
import { AssigneePicker } from '@/components/molecules/AssigneePicker';
import { DueDatePicker } from '@/components/molecules/DueDatePicker';
import { InlineEditText } from '@/components/molecules/InlineEditText';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SubtaskListProps {
  task: Task;
  members: ProjectMember[];
  canEdit: boolean;
}

/** TSK-07: thêm nhanh dạng danh sách, tick hoàn thành, giao người và đặt hạn riêng. */
export function SubtaskList({ task, members, canEdit }: SubtaskListProps) {
  const subtasks = task.subtasks ?? [];
  const { add, update, remove } = useSubtaskMutations(task);
  const [title, setTitle] = useState('');
  const done = subtasks.filter((s) => s.isDone).length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setTitle('');
    add.mutate({ title: value });
  };

  if (!canEdit && subtasks.length === 0) return null;

  return (
    <section className="space-y-2" aria-label="Việc con">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold">Việc con</h3>
        {subtasks.length > 0 && (
          <>
            <span className="text-muted-foreground text-xs tabular-nums">
              {done}/{subtasks.length}
            </span>
            <div className="bg-muted h-1.5 max-w-40 flex-1 overflow-hidden rounded-full" aria-hidden>
              <div className="h-full bg-green-600 transition-all" style={{ width: `${(done / subtasks.length) * 100}%` }} />
            </div>
          </>
        )}
      </div>

      <ul className="divide-y rounded-md border empty:hidden">
        {subtasks.map((subtask) => (
          <SubtaskRow
            key={subtask.id}
            subtask={subtask}
            members={members}
            canEdit={canEdit}
            onChange={(input) => update.mutate({ id: subtask.id, ...input })}
            onDelete={() => remove.mutate(subtask.id)}
          />
        ))}
      </ul>

      {canEdit && (
        <form onSubmit={submit} className="flex gap-2">
          <Input
            value={title}
            maxLength={255}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Thêm việc con, nhấn Enter"
            aria-label="Việc con mới"
            className="h-8"
          />
          <Button type="submit" size="sm" variant="outline" disabled={!title.trim() || add.isPending}>
            <Plus /> Thêm
          </Button>
        </form>
      )}
    </section>
  );
}

function SubtaskRow({
  subtask,
  members,
  canEdit,
  onChange,
  onDelete,
}: {
  subtask: Subtask;
  members: ProjectMember[];
  canEdit: boolean;
  onChange: (input: Partial<Pick<Subtask, 'title' | 'isDone' | 'assigneeId' | 'dueDate'>>) => void;
  onDelete: () => void;
}) {
  return (
    <li className="group flex items-center gap-2 px-2 py-1.5">
      <Checkbox
        checked={subtask.isDone}
        disabled={!canEdit}
        onCheckedChange={(checked) => onChange({ isDone: checked === true })}
        aria-label={`Hoàn thành: ${subtask.title}`}
      />
      <div className={cn('min-w-0 flex-1 text-sm', subtask.isDone && 'text-muted-foreground line-through')}>
        <InlineEditText
          value={subtask.title}
          disabled={!canEdit}
          ariaLabel="Tên việc con"
          onSave={(title) => onChange({ title })}
          className="w-full"
        />
      </div>
      <div className="w-32 shrink-0">
        <DueDatePicker
          value={subtask.dueDate}
          disabled={!canEdit}
          overdue={!subtask.isDone && isOverdue({ dueDate: subtask.dueDate, completedAt: null })}
          onChange={(dueDate) => onChange({ dueDate })}
        />
      </div>
      <div className="w-36 shrink-0">
        <AssigneePicker
          members={members}
          value={subtask.assignee ?? null}
          disabled={!canEdit}
          onChange={(assigneeId) => onChange({ assigneeId })}
        />
      </div>
      {canEdit && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Xóa việc con ${subtask.title}`}
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      )}
    </li>
  );
}
