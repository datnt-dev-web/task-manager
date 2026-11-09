import { useState, type KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import { useCreateTask } from '@/application/board/useBoard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/** BRD-07 / UX-01: gõ tiêu đề + Enter là tạo xong; giữ ô mở để thêm tiếp. */
/** Khi có sprint đang chạy, việc tạo trên bảng tự vào sprint đó (nếu không sẽ biến khỏi bảng). */
export function QuickAddTask({ projectId, columnId, sprintId = null }: { projectId: string; columnId: string; sprintId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const createTask = useCreateTask(projectId);

  const submit = () => {
    const value = title.trim();
    if (!value) return;
    setTitle('');
    createTask.mutate({ title: value, columnId, ...(sprintId ? { sprintId } : {}) });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setTitle('');
    }
  };

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground w-full justify-start" onClick={() => setOpen(true)}>
        <Plus /> Thêm công việc
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        autoFocus
        rows={2}
        maxLength={255}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => !title.trim() && setOpen(false)}
        placeholder="Cần làm gì? Nhấn Enter để thêm"
        aria-label="Tiêu đề công việc mới"
        className="bg-card resize-none text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onMouseDown={(e) => e.preventDefault()} onClick={submit} disabled={!title.trim()}>
          Thêm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Hủy
        </Button>
      </div>
    </div>
  );
}
