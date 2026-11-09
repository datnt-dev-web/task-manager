import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Tiêu đề trang thống nhất: tiêu đề, mô tả phụ, hành động bên phải. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 px-4 pt-5 pb-4 md:px-6', className)}>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold">{title}</h1>
        {description && <div className="text-muted-foreground mt-0.5 text-sm">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
