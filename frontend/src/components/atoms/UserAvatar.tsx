import { UserRound } from 'lucide-react';
import type { UserBrief } from '@/domain/entities';
import { displayName, initials } from '@/domain/rules/user.rules';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user?: Pick<UserBrief, 'fullName' | 'email' | 'avatarUrl'> | null;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

/** Ảnh đại diện; chưa giao việc thì hiện biểu tượng người trống. */
export function UserAvatar({ user, size = 'default', className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={className} title={displayName(user)}>
      {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName(user)} referrerPolicy="no-referrer" />}
      <AvatarFallback className={cn('text-xs', !user && 'text-muted-foreground')}>
        {user ? initials(user) : <UserRound className="size-3.5" aria-hidden />}
      </AvatarFallback>
    </Avatar>
  );
}
