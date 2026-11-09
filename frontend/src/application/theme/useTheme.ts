import { useCallback, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ThemePreference, User } from '@/domain/entities';
import { userApi } from '@/infrastructure/api/user.api';
import { queryKeys } from '../queryKeys';
import { ThemeContext } from './ThemeProvider';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme phải dùng bên trong ThemeProvider');
  return context;
}

/** Đổi giao diện ngay trên máy và lưu vào tài khoản để đồng bộ giữa các thiết bị. */
export function useChangeTheme() {
  const { setPreference } = useTheme();
  const queryClient = useQueryClient();

  return useCallback(
    (theme: ThemePreference) => {
      setPreference(theme);
      const user = queryClient.getQueryData<User | null>(queryKeys.session);
      if (!user) return;
      queryClient.setQueryData<User | null>(queryKeys.session, (old) => (old ? { ...old, theme } : old));
      userApi.updateMe({ theme }).catch(() => undefined); // lỗi mạng không ảnh hưởng hiển thị
    },
    [queryClient, setPreference],
  );
}

/** Khi đăng nhập trên máy mới: lấy lựa chọn đã lưu trong tài khoản. */
export function useSyncThemeWithUser(user: User | null | undefined) {
  const { setPreference } = useTheme();
  const syncedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!user || syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    setPreference(user.theme);
  }, [user, setPreference]);
}
