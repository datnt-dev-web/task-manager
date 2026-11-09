import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** UX-07: màn hình trống luôn có lời gợi ý và hành động tiếp theo. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-4 py-12 text-center', className)}>
      <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
