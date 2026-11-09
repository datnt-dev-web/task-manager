import { Check } from 'lucide-react';
import { COLOR_SWATCHES } from '@/domain/rules/project.rules';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/** Chọn màu từ bảng màu gợi ý (nhãn, dự án). */
export function ColorSwatchPicker({
  value,
  onChange,
  disabled,
  label = 'Chọn màu',
}: {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        aria-label={label}
        className="ring-offset-background focus-visible:ring-ring size-6 shrink-0 rounded-full border outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ backgroundColor: value }}
      />
      <PopoverContent className="grid w-auto grid-cols-5 gap-2 p-2" align="start">
        {COLOR_SWATCHES.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color}
            aria-pressed={color === value}
            onClick={() => onChange(color)}
            className={cn('flex size-7 items-center justify-center rounded-full text-white', color === value && 'ring-ring ring-2 ring-offset-2')}
            style={{ backgroundColor: color }}
          >
            {color === value && <Check className="size-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
