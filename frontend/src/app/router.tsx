import { createBrowserRouter } from 'react-router';
import { PageSpinner } from '@/components/atoms/Spinner';
import { RequireAuth } from './RequireAuth';

// Mỗi trang tải riêng khi cần (code-splitting) để bundle ban đầu nhỏ.
// Thêm trang mới: tạo file trong src/pages rồi khai báo route ở đây.
export const router = createBrowserRouter([
  {
    hydrateFallbackElement: <PageSpinner />,
    children: [
      {
        path: '/login',
        lazy: () => import('@/pages/LoginPage').then((m) => ({ Component: m.LoginPage })),
      },
      {
        element: <RequireAuth />,
        children: [
      { index: true, lazy: () => import('@/pages/MyWorkPage').then((m) => ({ Component: m.MyWorkPage })) },
      { path: 'projects', lazy: () => import('@/pages/ProjectsPage').then((m) => ({ Component: m.ProjectsPage })) },
      { path: 'projects/:projectId', lazy: () => import('@/pages/BoardPage').then((m) => ({ Component: m.BoardPage })) },
      { path: 'files', lazy: () => import('@/pages/FilesPage').then((m) => ({ Component: m.FilesPage })) },
      { path: 'settings', lazy: () => import('@/pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })) },
      { path: 'admin/users', lazy: () => import('@/pages/AdminUsersPage').then((m) => ({ Component: m.AdminUsersPage })) },
      { path: '*', lazy: () => import('@/pages/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })) },
        ],
      },
    ],
  },
]);
