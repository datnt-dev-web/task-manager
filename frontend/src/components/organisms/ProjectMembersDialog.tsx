import { useState, type ReactNode } from 'react';
import { UserPlus, X } from 'lucide-react';
import type { ProjectRole } from '@/domain/entities';
import { ROLE_LABELS } from '@/domain/rules/permissions';
import { displayName } from '@/domain/rules/user.rules';
import { useAddMember, useMembers, useRemoveMember, useUpdateMemberRole } from '@/application/projects/useProjects';
import { useUserDirectory } from '@/application/users/useUsers';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLES: ProjectRole[] = ['manager', 'member', 'viewer'];

/** PRJ-04: thêm/gỡ thành viên, đổi vai trò. Chỉ Quản lý dự án được sửa. */
export function ProjectMembersDialog({ projectId, canManage, trigger }: { projectId: string; canManage: boolean; trigger: ReactNode }) {
  const { data: members = [] } = useMembers(projectId);
  const updateRole = useUpdateMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thành viên dự án</DialogTitle>
          <DialogDescription>Người xem chỉ xem được, không sửa, không bình luận và không được giao việc.</DialogDescription>
        </DialogHeader>
        {canManage && <AddMember projectId={projectId} existing={new Set(members.map((m) => m.userId))} />}
        <ul className="max-h-96 divide-y overflow-y-auto">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 py-2">
              <UserAvatar user={m.user} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName(m.user)}</p>
                <p className="text-muted-foreground truncate text-xs">{m.user.email}</p>
              </div>
              {canManage ? (
                <>
                  <Select value={m.role} onValueChange={(role) => updateRole.mutate({ userId: m.userId, role: role as ProjectRole })}>
                    <SelectTrigger size="sm" className="w-36" aria-label={`Vai trò của ${displayName(m.user)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Gỡ ${displayName(m.user)} khỏi dự án`}
                    onClick={() => removeMember.mutate(m.userId)}
                  >
                    <X />
                  </Button>
                </>
              ) : (
                <span className="text-muted-foreground text-xs">{ROLE_LABELS[m.role]}</span>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function AddMember({ projectId, existing }: { projectId: string; existing: Set<string> }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<ProjectRole>('member');
  const { data } = useUserDirectory(q);
  const addMember = useAddMember(projectId);
  const candidates = (data?.items ?? []).filter((u) => !existing.has(u.id));

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex-1 justify-start">
            <UserPlus /> Thêm người vào dự án
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Tìm theo tên hoặc email..." value={q} onValueChange={setQ} />
            <CommandList>
              <CommandEmpty>Không tìm thấy. Nhờ Quản trị viên thêm email vào hệ thống trước.</CommandEmpty>
              <CommandGroup>
                {candidates.map((u) => (
                  <CommandItem
                    key={u.id}
                    value={u.id}
                    onSelect={() => {
                      addMember.mutate({ userId: u.id, role });
                      setOpen(false);
                      setQ('');
                    }}
                  >
                    <UserAvatar user={u} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate">{displayName(u)}</span>
                      <span className="text-muted-foreground block truncate text-xs">{u.email}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Select value={role} onValueChange={(r) => setRole(r as ProjectRole)}>
        <SelectTrigger className="w-36" aria-label="Vai trò khi thêm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_LABELS[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
