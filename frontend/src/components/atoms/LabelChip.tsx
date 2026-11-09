import type { Label } from '@/domain/entities';
import { cn } from '@/lib/utils';

export function LabelChip({ label, className }: { label: Pick<Label, 'name' | 'color'>; className?: string }) {
  return (
    <span
      className={cn('inline-flex max-w-full items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium', className)}
      style={{ backgroundColor: `${label.color}22`, color: label.color }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: label.color }} aria-hidden />
      <span className="truncate brightness-75 dark:brightness-125">{label.name}</span>
    </span>
  );
}
