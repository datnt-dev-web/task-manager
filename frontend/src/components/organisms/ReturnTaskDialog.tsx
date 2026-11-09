import { useState, type FormEvent } from 'react';
import { Undo2 } from 'lucide-react';
import type { BoardColumn, Task } from '@/domain/entities';
import { useReturnTask } from '@/application/tasks/useTasks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ReturnTaskDialogProps {
  task: Task;
  /** Các cột của bảng, đã sắp theo vị trí. */
  columns: BoardColumn[];
}

/**
 * Quy trình duyệt: Admin trả lại công việc kèm lý do (bắt buộc). Mặc định trả về cột liền trước
 * (ví dụ Chờ duyệt → Đang làm). Lý do được lưu thành bình luận và gửi thông báo cho người làm.
 */
export function ReturnTaskDialog({ task, columns }: ReturnTaskDialogProps) {
  const index = columns.findIndex((c) => c.id === task.columnId);
  const targets = columns.filter((c) => c.id !== task.columnId && !c.isDone);
  const defaultTarget = columns[index - 1] && !columns[index - 1].isDone ? columns[index - 1].id : (targets[0]?.id ?? '');

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [columnId, setColumnId] = useState(defaultTarget);
  const returnTask = useReturnTask(task);
  const tooShort = reason.trim().length < 3;

  if (index <= 0 || targets.length === 0) return null;

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) {
      setReason('');
      setColumnId(defaultTarget);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (tooShort) return;
    returnTask.mutate({ reason: reason.trim(), columnId }, { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Undo2 /> Trả lại
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Trả lại {task.key}</DialogTitle>
            <DialogDescription>
              Lý do sẽ được lưu thành bình luận{task.assignee ? ' và gửi thông báo cho người làm' : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="return-reason">Lý do trả lại</Label>
            <Textarea
              id="return-reason"
              autoFocus
              rows={4}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Thiếu phần giới thiệu đội ngũ, bổ sung thêm ảnh văn phòng."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="return-column">Chuyển về cột</Label>
            <Select value={columnId} onValueChange={setColumnId}>
              <SelectTrigger id="return-column" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targets.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={tooShort || !columnId || returnTask.isPending}>
              {returnTask.isPending ? 'Đang trả lại…' : 'Trả lại'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
