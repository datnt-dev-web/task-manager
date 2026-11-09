import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { AppNotification } from '@/domain/entities';
import { notificationDetail, notificationLink, notificationText } from '@/domain/rules/notification.rules';
import { useMarkNotificationsRead, useNotificationList, useUnreadCount } from '@/application/notifications/useNotifications';
import { Spinner } from '@/components/atoms/Spinner';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { fromNow } from '@/lib/date';
import { cn } from '@/lib/utils';

/** NTF-01: chuông thông báo — số chưa đọc, bấm vào mở đúng công việc, đánh dấu đã đọc tất cả. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadCount();
  const { data, isLoading } = useNotificationList(open);
  const markRead = useMarkNotificationsRead();
  const navigate = useNavigate();

  const openNotification = (n: AppNotification) => {
    setOpen(false);
    if (!n.readAt) markRead.mutate([n.id]);
    navigate(notificationLink(n));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ''}`}>
          <Bell />
          {unread > 0 && (
            <span className="bg-destructive absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Thông báo</p>
          <Button variant="ghost" size="xs" disabled={unread === 0} onClick={() => markRead.mutate(undefined)}>
            <CheckCheck /> Đánh dấu đã đọc tất cả
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center p-6">
              <Spinner />
            </div>
          )}
          {data?.items.length === 0 && <EmptyState icon={Bell} title="Chưa có thông báo" className="py-8" />}
          <ul>
            {data?.items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  className={cn('hover:bg-muted/60 flex w-full gap-3 px-3 py-2.5 text-left', !n.readAt && 'bg-primary/5')}
                >
                  <UserAvatar user={n.actor} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-sm leading-snug', !n.readAt && 'font-medium')}>{notificationText(n)}</span>
                    <span className="text-muted-foreground block truncate text-xs">{notificationDetail(n)}</span>
                    <span className="text-muted-foreground text-xs">{fromNow(n.createdAt)}</span>
                  </span>
                  {!n.readAt && <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" aria-label="Chưa đọc" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
