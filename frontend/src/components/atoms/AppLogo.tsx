import { SquareKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2 font-semibold', className)}>
      <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
        <SquareKanban className="size-4" aria-hidden />
      </span>
      {!compact && <span className="truncate">Task Manager</span>}
    </span>
  );
}
