import { LogOut, Settings, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import type { User } from '@/domain/entities';
import { displayName } from '@/domain/rules/user.rules';
import { useSignOut } from '@/application/auth/useSession';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { ThemeSwitcher } from '@/components/molecules/ThemeSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Menu ảnh đại diện góc phải trên: thông tin, đổi giao diện nhanh (THM-01), đăng xuất. */
export function UserMenu({ user }: { user: User }) {
  const signOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:ring-2 focus-visible:ring-ring outline-none" aria-label="Tài khoản">
        <UserAvatar user={user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          <UserAvatar user={user} />
          <span className="min-w-0">
            <span className="block truncate font-medium">{displayName(user)}</span>
            <span className="text-muted-foreground block truncate text-xs">{user.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-muted-foreground mb-1.5 text-xs">Giao diện</p>
          <ThemeSwitcher />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings /> Cài đặt cá nhân
          </Link>
        </DropdownMenuItem>
        {user.isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin/users">
              <ShieldCheck /> Quản lý nhân viên
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => signOut.mutate()}>
          <LogOut /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
