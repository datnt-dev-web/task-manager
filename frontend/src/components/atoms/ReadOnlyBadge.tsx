import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/** Cho Người xem biết vì sao không thao tác được (spec 2.3). */
export function ReadOnlyBadge() {
  return (
    <Badge variant="secondary" className="gap-1">
      <Eye className="size-3" aria-hidden />
      Chỉ xem
    </Badge>
  );
}
