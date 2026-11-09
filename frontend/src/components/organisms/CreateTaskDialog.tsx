import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { canEditTasks } from '@/domain/rules/permissions';
import { useCreateTask } from '@/application/board/useBoard';
import { useProjects } from '@/application/projects/useProjects';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** TSK-01: nút "+ Tạo" toàn cục (phím tắt C). Mặc định chọn dự án đang xem. */
export function CreateTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { projectId: currentProjectId } = useParams();
  const [, setSearchParams] = useSearchParams();
  const { data: projects = [] } = useProjects();
  const writable = projects.filter((p) => canEditTasks(p.role));
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const createTask = useCreateTask(projectId);

  useEffect(() => {
    if (!open) return;
    const preferred = writable.find((p) => p.id === currentProjectId) ?? writable[0];
    setProjectId(preferred?.id ?? '');
    setTitle('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!projectId || !title.trim()) return;
    createTask.mutate(
      { title: title.trim() },
      {
        onSuccess: (task) => {
          onOpenChange(false);
          setSearchParams((params) => {
            params.set('task', task.key);
            return params;
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Tạo công việc</DialogTitle>
            <DialogDescription>Chỉ cần tiêu đề, các thông tin khác bổ sung sau.</DialogDescription>
          </DialogHeader>
          {writable.length === 0 ? (
            <p className="text-muted-foreground text-sm">Bạn chưa tham gia dự án nào với quyền tạo công việc.</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Dự án</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="w-full" aria-label="Dự án">
                    <SelectValue placeholder="Chọn dự án" />
                  </SelectTrigger>
                  <SelectContent>
                    {writable.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} <span className="text-muted-foreground">({p.key})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-title">Tiêu đề</Label>
                <Input
                  id="task-title"
                  autoFocus
                  maxLength={255}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Cần làm gì?"
                />
              </div>
            </>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!projectId || !title.trim() || createTask.isPending}>
              Tạo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
