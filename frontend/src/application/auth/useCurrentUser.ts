import type { User } from '@/domain/entities';
import { useSession } from './useSession';

/** Người dùng hiện tại — chỉ dùng bên trong route đã yêu cầu đăng nhập (RequireAuth). */
export function useCurrentUser(): User {
  const { data } = useSession();
  if (!data) throw new Error('useCurrentUser chỉ dùng trong route đã đăng nhập');
  return data;
}
