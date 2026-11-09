import { useState } from 'react';
import { Check, Tag } from 'lucide-react';
import type { Label } from '@/domain/entities';
import { LabelChip } from '@/components/atoms/LabelChip';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface LabelPickerProps {
  options: Label[];
  value: Label[];
  onChange: (labelIds: string[]) => void;
  disabled?: boolean;
}

/** Gắn/bỏ nhãn cho công việc: bấm để bật/tắt từng nhãn, lưu khi đóng danh sách. */
export function LabelPicker({ options, value, onChange, disabled }: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const onOpenChange = (next: boolean) => {
    if (next) setSelected(value.map((l) => l.id));
    else {
      const before = value.map((l) => l.id).sort().join();
      if ([...selected].sort().join() !== before) onChange(selected);
    }
    setOpen(next);
  };
  const toggle = (id: string) => setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button variant="ghost" size="sm" className="h-auto min-h-8 w-full flex-wrap justify-start gap-1 px-2 py-1" aria-label="Nhãn">
          {value.length === 0 ? (
            <span className="text-muted-foreground flex items-center gap-2">
              <Tag className="size-4" /> Chưa có nhãn
            </span>
          ) : (
            value.map((l) => <LabelChip key={l.id} label={l} />)
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm nhãn..." />
          <CommandList>
            <CommandEmpty>Dự án chưa có nhãn này. Quản lý dự án tạo nhãn ở nút “Nhãn” trên bảng.</CommandEmpty>
            <CommandGroup>
              {options.map((label) => (
                <CommandItem key={label.id} value={label.name} onSelect={() => toggle(label.id)}>
                  <span className="size-3 rounded-full" style={{ backgroundColor: label.color }} aria-hidden />
                  <span className="truncate">{label.name}</span>
                  {selected.includes(label.id) && <Check className="ml-auto size-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
