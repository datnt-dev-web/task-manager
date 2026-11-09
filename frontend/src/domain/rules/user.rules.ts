import type { UserBrief } from '../entities';

export const displayName = (user?: Pick<UserBrief, 'fullName' | 'email'> | null) =>
  user ? user.fullName?.trim() || user.email.split('@')[0] : 'Chưa giao';

export function initials(user?: Pick<UserBrief, 'fullName' | 'email'> | null) {
  if (!user) return '?';
  const parts = displayName(user).split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}
