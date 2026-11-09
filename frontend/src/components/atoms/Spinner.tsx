import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className, label = 'Đang tải' }: { className?: string; label?: string }) {
  return <Loader2 className={cn('text-muted-foreground size-5 animate-spin', className)} aria-label={label} role="status" />;
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-6" />
    </div>
  );
}
