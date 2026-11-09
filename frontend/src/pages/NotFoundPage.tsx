import { SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <EmptyState
      icon={SearchX}
      title="Không tìm thấy trang"
      description="Đường dẫn không đúng hoặc trang đã bị xóa."
      action={
        <Button asChild>
          <Link to="/">Về trang chủ</Link>
        </Button>
      }
      className="min-h-[60vh]"
    />
  );
}
