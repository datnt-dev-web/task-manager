import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Tags, Trash2 } from 'lucide-react';
import { COLOR_SWATCHES } from '@/domain/rules/project.rules';
import { useLabels } from '@/application/projects/useProjects';
import { useLabelMutations } from '@/application/projects/useLabelMutations';
import { LabelChip } from '@/components/atoms/LabelChip';
import { ColorSwatchPicker } from '@/components/molecules/ColorSwatchPicker';
import { EmptyState } from '@/components/molecules/EmptyState';
import { InlineEditText } from '@/components/molecules/InlineEditText';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

/** PRJ-06: Quản lý dự án tạo, đổi tên, đổi màu, xóa nhãn. */
export function LabelManagerDialog({ projectId, trigger }: { projectId: string; trigger: ReactNode }) {
  const { data: labels = [] } = useLabels(projectId);
  const { create, update, remove } = useLabelMutations(projectId);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_SWATCHES[5]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          setName('');
          setColor(COLOR_SWATCHES[(COLOR_SWATCHES.indexOf(color) + 1) % COLOR_SWATCHES.length]);
        },
      },
    );
  };

  return (
    <Dialog onOpenChange={() => setConfirmId(null)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        // Mở ra là gõ được tên nhãn ngay (mặc định Radix focus nút chọn màu đứng đầu).
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          nameInput.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Nhãn của dự án</DialogTitle>
          <DialogDescription>Dùng nhãn để phân loại công việc, ví dụ “Gấp khách hàng”, “Nội bộ”.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex items-center gap-2">
          <ColorSwatchPicker value={color} onChange={setColor} label="Màu nhãn mới" />
          <Input ref={nameInput} value={name} maxLength={50} onChange={(e) => setName(e.target.value)} placeholder="Tên nhãn mới" aria-label="Tên nhãn mới" />
          <Button type="submit" disabled={!name.trim() || create.isPending}>
            Thêm
          </Button>
        </form>
        {name.trim() && (
          <p className="text-muted-foreground -mt-2 text-xs">
            Xem trước: <LabelChip label={{ name: name.trim(), color }} />
          </p>
        )}

        {labels.length === 0 ? (
          <EmptyState icon={Tags} title="Chưa có nhãn nào" className="py-6" />
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto rounded-md border">
            {labels.map((label) => (
              <li key={label.id} className="flex items-center gap-2 px-3 py-2">
                <ColorSwatchPicker value={label.color} onChange={(c) => update.mutate({ id: label.id, color: c })} label={`Màu của ${label.name}`} />
                <div className="min-w-0 flex-1 text-sm">
                  <InlineEditText
                    value={label.name}
                    maxLength={50}
                    ariaLabel="Tên nhãn"
                    onSave={(value) => update.mutate({ id: label.id, name: value })}
                    className="w-full"
                  />
                </div>
                {confirmId === label.id ? (
                  <span className="flex items-center gap-1">
                    <Button size="xs" variant="destructive" onClick={() => remove.mutate(label.id)}>
                      Xóa
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setConfirmId(null)}>
                      Hủy
                    </Button>
                  </span>
                ) : (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Xóa nhãn ${label.name}`}
                    title="Xóa nhãn (gỡ khỏi mọi công việc)"
                    onClick={() => setConfirmId(label.id)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
