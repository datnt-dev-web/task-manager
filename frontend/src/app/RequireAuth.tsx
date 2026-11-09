import { Navigate, useLocation } from 'react-router';
import { useSession } from '@/application/auth/useSession';
import { PageSpinner } from '@/components/atoms/Spinner';
import { AppLayout } from '@/components/templates/AppLayout';

/** Chặn route khi chưa đăng nhập; giữ lại đường dẫn để quay về sau khi đăng nhập. */
export function RequireAuth() {
  const { data: user, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <AppLayout user={user} />;
}
