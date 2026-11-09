import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { PROJECT_KEY_PATTERN, suggestProjectKey } from '@/domain/rules/project.rules';
import { useCreateProject } from '@/application/projects/useProjects';
import { getErrorMessage } from '@/infrastructure/http/apiError';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** PRJ-01: chỉ cần nhập tên; mã dự án tự gợi ý và sửa được. */
export function CreateProjectDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyTouched, setKeyTouched] = useState(false);
  const createProject = useCreateProject();
  const navigate = useNavigate();

  const effectiveKey = keyTouched ? key : suggestProjectKey(name);
  const keyValid = PROJECT_KEY_PATTERN.test(effectiveKey);

  const reset = () => {
    setName('');
    setKey('');
    setKeyTouched(false);
    createProject.reset();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !keyValid) return;
    createProject.mutate(
      { name: name.trim(), key: effectiveKey },
      {
        onSuccess: (project) => {
          setOpen(false);
          reset();
          navigate(`/projects/${project.id}`);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Tạo dự án</DialogTitle>
            <DialogDescription>Dự án mới có sẵn bảng với 4 cột: Cần làm, Đang làm, Chờ duyệt, Hoàn thành.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="project-name">Tên dự án</Label>
            <Input
              id="project-name"
              autoFocus
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Marketing quý 4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-key">Mã dự án</Label>
            <Input
              id="project-key"
              maxLength={6}
              value={effectiveKey}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
              }}
              aria-invalid={!!effectiveKey && !keyValid}
              className="uppercase"
            />
            <p className="text-muted-foreground text-xs">
              Dùng để đặt mã công việc, ví dụ <strong>{effectiveKey || 'MKT'}-1</strong>. 2–6 ký tự, không đổi được sau khi có công việc.
            </p>
          </div>
          {createProject.isError && <p className="text-destructive text-sm">{getErrorMessage(createProject.error)}</p>}
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || !keyValid || createProject.isPending}>
              Tạo dự án
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
