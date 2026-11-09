import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { User } from '@/domain/entities';
import { canEditTasks } from '@/domain/rules/permissions';
import { useProjects } from '@/application/projects/useProjects';
import { UserMenu } from '@/components/molecules/UserMenu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CreateTaskDialog } from './CreateTaskDialog';
import { NotificationBell } from './NotificationBell';

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export function AppHeader({ user }: { user: User }) {
  const [creating, setCreating] = useState(false);
  // Chỉ Quản trị viên / Quản lý dự án được tạo công việc → nhân viên không thấy nút Tạo.
  const { data: projects = [] } = useProjects();
  const canCreate = user.isAdmin || projects.some((p) => canEditTasks(p.role));

  // UI-03: phím tắt C để tạo công việc.
  useEffect(() => {
    if (!canCreate) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target)) {
        if (document.querySelector('[role="dialog"]')) return;
        e.preventDefault();
        setCreating(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canCreate]);

  return (
    <header className="bg-background/95 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
      <SidebarTrigger aria-label="Thu gọn / mở thanh bên" />
      <Separator orientation="vertical" className="mr-1 h-5" />
      {canCreate && (
        <Button size="sm" onClick={() => setCreating(true)} title="Tạo công việc (phím C)">
          <Plus /> Tạo
        </Button>
      )}
      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <UserMenu user={user} />
      </div>
      {canCreate && <CreateTaskDialog open={creating} onOpenChange={setCreating} />}
    </header>
  );
}
