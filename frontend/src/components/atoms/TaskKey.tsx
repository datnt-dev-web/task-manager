import { cn } from '@/lib/utils';

export function TaskKey({ value, className, done }: { value: string; className?: string; done?: boolean }) {
  return (
    <span className={cn('text-muted-foreground text-xs font-medium tabular-nums', done && 'line-through', className)}>
      {value}
    </span>
  );
}
