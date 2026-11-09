import { useState } from 'react';
import { addDays, nextSaturday, parseISO } from 'date-fns';
import { vi } from 'react-day-picker/locale';
import { CalendarDays, X } from 'lucide-react';
import { formatDueDate, toIsoDate } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DueDatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  overdue?: boolean;
}

/** Chọn hạn, có lựa chọn nhanh Hôm nay / Ngày mai / Cuối tuần (spec 4.5). */
export function DueDatePicker({ value, onChange, disabled, overdue }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const pick = (date: Date | null) => {
    setOpen(false);
    onChange(date ? toIsoDate(date) : null);
  };
  const today = new Date();
  const quick = [
    { label: 'Hôm nay', date: today },
    { label: 'Ngày mai', date: addDays(today, 1) },
    { label: 'Cuối tuần', date: nextSaturday(today) },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 px-2" aria-label="Hạn chót">
          <CalendarDays className="size-4" aria-hidden />
          <span className={cn(!value && 'text-muted-foreground', overdue && 'font-medium text-red-600 dark:text-red-400')}>
            {value ? formatDueDate(value) : 'Chưa đặt hạn'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex gap-1 border-b p-2">
          {quick.map((q) => (
            <Button key={q.label} variant="outline" size="xs" onClick={() => pick(q.date)}>
              {q.label}
            </Button>
          ))}
          {value && (
            <Button variant="ghost" size="xs" onClick={() => pick(null)} className="ml-auto">
              <X className="size-3" /> Xóa hạn
            </Button>
          )}
        </div>
        <Calendar
          mode="single"
          locale={vi}
          weekStartsOn={1}
          selected={value ? parseISO(value) : undefined}
          onSelect={(date) => date && pick(date)}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
