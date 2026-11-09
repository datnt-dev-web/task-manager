import { lazy, Suspense, useCallback } from 'react';
import { Outlet, useSearchParams } from 'react-router';
import type { User } from '@/domain/entities';
import { useSyncThemeWithUser } from '@/application/theme/useTheme';
import { AppHeader } from '@/components/organisms/AppHeader';
import { AppSidebar } from '@/components/organisms/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

// Cửa sổ chi tiết kéo theo trình soạn thảo TipTap → chỉ tải khi mở công việc.
const TaskDetailDialog = lazy(() =>
  import('@/components/organisms/TaskDetailDialog').then((m) => ({ default: m.TaskDetailDialog })),
);

const sidebarOpenFromCookie = () => !document.cookie.includes('sidebar_state=false');

/**
 * Khung trang sau đăng nhập: thanh bên + header + nội dung.
 * Chi tiết công việc mở ở mọi trang qua query `?task=KEY` để có link chia sẻ (TSK-04).
 */
export function AppLayout({ user }: { user: User }) {
  useSyncThemeWithUser(user);
  const [searchParams, setSearchParams] = useSearchParams();
  const taskKey = searchParams.get('task');

  const closeTask = useCallback(
    () =>
      setSearchParams((params) => {
        params.delete('task');
        return params;
      }),
    [setSearchParams],
  );

  return (
    <SidebarProvider defaultOpen={sidebarOpenFromCookie()}>
      <AppSidebar user={user} />
      <SidebarInset className="min-w-0">
        <AppHeader user={user} />
        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
      </SidebarInset>
      {taskKey && (
        <Suspense fallback={null}>
          <TaskDetailDialog taskKey={taskKey} currentUser={user} onClose={closeTask} />
        </Suspense>
      )}
    </SidebarProvider>
  );
}
