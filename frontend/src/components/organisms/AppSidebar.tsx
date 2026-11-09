import { FolderKanban, House, Paperclip, Plus, ShieldCheck } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';
import type { User } from '@/domain/entities';
import { useProjects } from '@/application/projects/useProjects';
import { AppLogo } from '@/components/atoms/AppLogo';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from '@/components/ui/sidebar';
import { CreateProjectDialog } from './CreateProjectDialog';

/** UI-01: Việc của tôi, danh sách dự án; thu gọn được và ghi nhớ trạng thái. */
export function AppSidebar({ user }: { user: User }) {
  const { pathname } = useLocation();
  const { data: projects, isLoading } = useProjects();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <AppLogo className="px-1 py-1.5 group-data-[collapsible=icon]:px-0" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/'} tooltip="Việc của tôi">
                <NavLink to="/">
                  <House /> <span>Việc của tôi</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/projects'} tooltip="Tất cả dự án">
                <NavLink to="/projects">
                  <FolderKanban /> <span>Tất cả dự án</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/files'} tooltip="Tệp đính kèm">
                <NavLink to="/files">
                  <Paperclip /> <span>Tệp đính kèm</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {user.isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/admin')} tooltip="Quản lý nhân viên">
                  <NavLink to="/admin/users">
                    <ShieldCheck /> <span>Quản lý nhân viên</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Dự án của tôi</SidebarGroupLabel>
          <CreateProjectDialog
            trigger={
              <SidebarGroupAction title="Tạo dự án" aria-label="Tạo dự án">
                <Plus />
              </SidebarGroupAction>
            }
          />
          <SidebarMenu>
            {isLoading && Array.from({ length: 3 }, (_, i) => <SidebarMenuSkeleton key={i} showIcon />)}
            {projects?.map((project) => (
              <SidebarMenuItem key={project.id}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(`/projects/${project.id}`)} tooltip={project.name}>
                  <NavLink to={`/projects/${project.id}`}>
                    <span
                      className="flex size-4 shrink-0 items-center justify-center rounded-sm text-[9px] font-bold text-white"
                      style={{ backgroundColor: project.color ?? '#3b82f6' }}
                      aria-hidden
                    >
                      {project.key[0]}
                    </span>
                    <span className="truncate">{project.name}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
