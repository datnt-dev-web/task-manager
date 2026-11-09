import type { AppNotification, Paginated } from '@/domain/entities';
import { http, unwrap } from '../http/client';

export const notificationApi = {
  list: async (params: { unreadOnly?: boolean; page?: number; pageSize?: number } = {}): Promise<Paginated<AppNotification>> => {
    const { data } = await http.get('/notifications', { params });
    return { items: data.data, meta: data.meta };
  },
  unreadCount: () => unwrap<{ count: number }>(http.get('/notifications/unread-count')).then((d) => d.count),
  markRead: (ids?: string[]) => http.post('/notifications/read', ids ? { ids } : { all: true }).then(() => undefined),
};
