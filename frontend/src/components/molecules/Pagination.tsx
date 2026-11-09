import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Đơn vị hiển thị ở dòng đếm, vd. "công việc", "tệp". */
  unit?: string;
  className?: string;
}

/** Dãy số trang rút gọn: 1 … 4 5 6 … 20 */
function pageItems(page: number, pages: number): (number | 'gap')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items: (number | 'gap')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) items.push('gap');
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < pages - 1) items.push('gap');
  items.push(pages);
  return items;
}

/** Phân trang theo dữ liệu backend trả về (meta: page, pageSize, total). */
export function Pagination({ page, pageSize, total, onPageChange, unit, className }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav aria-label="Phân trang" className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
      <p className="text-muted-foreground text-sm">
        {from}–{to} / {total}
        {unit ? ` ${unit}` : ''}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft />
        </Button>
        {pageItems(page, pages).map((item, i) =>
          item === 'gap' ? (
            <span key={`gap-${i}`} className="text-muted-foreground px-1">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? 'default' : 'ghost'}
              size="sm"
              className="min-w-8"
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
