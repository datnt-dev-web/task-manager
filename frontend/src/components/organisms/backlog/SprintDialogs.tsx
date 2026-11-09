import { useEffect, useState, type FormEvent } from 'react';
import type { Sprint, SprintWithTasks } from '@/domain/entities';
import { defaultSprintDates, sprintProgress } from '@/domain/rules/sprint.rules';
import { useSprintActions } from '@/application/sprints/useSprints';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface SprintFormDialogProps {
  projectId: string;
  sprint: Sprint | null;
  /** "start": bắt đầu sprint (bắt buộc ngày); "edit": sửa tên, mục tiêu, ngày. */
  mode: 'start' | 'edit';
  onOpenChange: (open: boolean) => void;
}

/** SPR-02/04: sửa sprint hoặc bắt đầu sprint (mặc định từ hôm nay, kéo dài 2 tuần). */
export function SprintFormDialog({ projectId, sprint, mode, onOpenChange }: SprintFormDialogProps) {
  const { update, start } = useSprintActions(projectId);
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });

  useEffect(() => {
    if (!sprint) return;
    const defaults = defaultSprintDates();
    setForm({
      name: sprint.name,
      goal: sprint.goal ?? '',
      startDate: sprint.startDate ?? (mode === 'start' ? defaults.startDate : ''),
      endDate: sprint.endDate ?? (mode === 'start' ? defaults.endDate : ''),
    });
  }, [sprint, mode]);

  const invalidDates = !!form.startDate && !!form.endDate && form.endDate < form.startDate;
  const missingDates = mode === 'start' && (!form.startDate || !form.endDate);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sprint || invalidDates || missingDates || !form.name.trim()) return;
    await update.mutateAsync({
      id: sprint.id,
      name: form.name.trim(),
      goal: form.goal.trim() || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    });
    if (mode === 'start') await start.mutateAsync({ id: sprint.id, startDate: form.startDate, endDate: form.endDate });
    onOpenChange(false);
  };

  return (
    <Dialog open={!!sprint} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === 'start' ? 'Bắt đầu sprint' : 'Sửa sprint'}</DialogTitle>
            {mode === 'start' && (
              <DialogDescription>Khi sprint chạy, bảng chỉ hiện công việc của sprint này. Mỗi dự án chạy 1 sprint một lúc.</DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="sprint-name">Tên sprint</Label>
            <Input id="sprint-name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sprint-start">Ngày bắt đầu</Label>
              <Input id="sprint-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sprint-end">Ngày kết thúc</Label>
              <Input
                id="sprint-end"
                type="date"
                value={form.endDate}
                aria-invalid={invalidDates}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          {invalidDates && <p className="text-destructive text-sm">Ngày kết thúc phải sau ngày bắt đầu</p>}
          <div className="space-y-1.5">
            <Label htmlFor="sprint-goal">Mục tiêu sprint</Label>
            <Textarea
              id="sprint-goal"
              rows={3}
              maxLength={2000}
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              placeholder="Sprint này cần đạt được gì?"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={invalidDates || missingDates || !form.name.trim() || update.isPending || start.isPending}>
              {mode === 'start' ? 'Bắt đầu' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CompleteSprintDialogProps {
  projectId: string;
  sprint: SprintWithTasks | null;
  plannedSprints: Sprint[];
  onOpenChange: (open: boolean) => void;
}

/** SPR-05: hoàn thành sprint — chọn nơi nhận công việc chưa xong. */
export function CompleteSprintDialog({ projectId, sprint, plannedSprints, onOpenChange }: CompleteSprintDialogProps) {
  const { complete } = useSprintActions(projectId);
  const [target, setTarget] = useState('backlog');
  useEffect(() => setTarget('backlog'), [sprint]);
  if (!sprint) return null;
  const { done, total, open } = sprintProgress(sprint.tasks);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hoàn thành {sprint.name}</DialogTitle>
          <DialogDescription>
            {done}/{total} công việc đã xong.
            {open > 0 ? ` Còn ${open} việc chưa xong — chọn nơi chuyển các việc này.` : ' Tuyệt vời, không còn việc dở dang!'}
          </DialogDescription>
        </DialogHeader>
        {open > 0 && (
          <div className="space-y-1.5">
            <Label>Chuyển việc chưa xong sang</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="w-full" aria-label="Chuyển việc chưa xong sang">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                {plannedSprints.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            disabled={complete.isPending}
            onClick={() =>
              complete.mutate(
                { id: sprint.id, moveToSprintId: target === 'backlog' ? null : target },
                { onSuccess: () => onOpenChange(false) },
              )
            }
          >
            Hoàn thành sprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
