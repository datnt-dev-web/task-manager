import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/infrastructure/api/notification.api';
import { queryKeys } from '../queryKeys';

const POLL_MS = 30_000;

/** NTF-01: số chưa đọc, tự cập nhật mỗi 30 giây (MVP chưa có thời gian thực). */
export const useUnreadCount = () =>
  useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: notificationApi.unreadCount,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });

export const useNotificationList = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationApi.list({ pageSize: 30 }),
    enabled,
  });

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => notificationApi.markRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}
