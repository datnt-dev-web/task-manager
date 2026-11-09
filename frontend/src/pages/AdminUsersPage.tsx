import { useState } from 'react';
import { Navigate } from 'react-router';
import type { UserStatus } from '@/domain/entities';
import { useCurrentUser } from '@/application/auth/useCurrentUser';
import { displayName } from '@/domain/rules/user.rules';
import { useAdminUpdateUser, useAllUsers, useInviteUsers } from '@/application/users/useUsers';
import { Spinner } from '@/components/atoms/Spinner';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { PageHeader } from '@/components/templates/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/date';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { Pagination } from '@/components/molecules/Pagination';

const STATUS: Record<UserStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: 'Đang hoạt động', variant: 'default' },
  invited: { label: 'Đã mời', variant: 'secondary' },
  disabled: { label: 'Đã khóa', variant: 'destructive' },
};

const parseEmails = (text: string) =>
  text
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);

const PAGE_SIZE = 20;

/** ADM-01..04: thêm Gmail của nhân viên, khóa/mở tài khoản, cấp quyền quản trị. */
export function AdminUsersPage() {
  const user = useCurrentUser();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [emails, setEmails] = useState('');
  const { data, isLoading } = useAllUsers(useDebouncedValue(q.trim()), page, PAGE_SIZE);
  const invite = useInviteUsers();
  const update = useAdminUpdateUser();

  if (!user.isAdmin) return <Navigate to="/" replace />;

  const parsed = parseEmails(emails);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <PageHeader
        title="Quản lý nhân viên"
        description="Thêm nhân viên bằng email, cấp quyền Quản trị viên. Khi nhân viên nghỉ việc, hãy khóa tài khoản."
      />

      <section className="bg-card mx-4 space-y-3 rounded-lg border p-4 md:mx-6" aria-label="Thêm nhân viên">
        <h2 className="text-sm font-semibold">Thêm nhân viên</h2>
        <Textarea
          rows={3}
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="Nhập một hoặc nhiều Gmail, cách nhau bằng dấu phẩy hoặc xuống dòng"
          aria-label="Danh sách email"
        />
        <Button
          disabled={parsed.length === 0 || invite.isPending}
          onClick={() => invite.mutate(parsed, { onSuccess: () => setEmails('') })}
        >
          Thêm {parsed.length > 0 ? `${parsed.length} người` : ''}
        </Button>
      </section>

      <section className="mx-4 space-y-3 md:mx-6" aria-label="Danh sách nhân viên">
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo tên hoặc email" className="sm:w-72" />
        {isLoading && <Spinner />}
        <ul className="bg-card divide-y rounded-lg border">
          {data?.items.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <UserAvatar user={u} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {displayName(u)} {u.isAdmin && <Badge variant="outline">Quản trị viên</Badge>}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {u.email}
                  {u.lastLoginAt && ` · Đăng nhập gần nhất ${formatDateTime(u.lastLoginAt)}`}
                </p>
              </div>
              <Badge variant={STATUS[u.status].variant}>{STATUS[u.status].label}</Badge>
              {u.id !== user.id && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => update.mutate({ userId: u.id, isAdmin: !u.isAdmin })}>
                    {u.isAdmin ? 'Bỏ quyền QTV' : 'Cấp quyền QTV'}
                  </Button>
                  <Button
                    variant={u.status === 'disabled' ? 'outline' : 'ghost'}
                    size="sm"
                    className={u.status === 'disabled' ? '' : 'text-destructive hover:text-destructive'}
                    onClick={() => update.mutate({ userId: u.id, status: u.status === 'disabled' ? 'active' : 'disabled' })}
                  >
                    {u.status === 'disabled' ? 'Mở khóa' : 'Khóa'}
                  </Button>
                </div>
              )}
            </li>
          ))}
          {data?.items.length === 0 && <li className="text-muted-foreground px-4 py-6 text-center text-sm">Không tìm thấy nhân viên.</li>}
        </ul>
        {data && (
          <Pagination page={data.meta.page} pageSize={data.meta.pageSize} total={data.meta.total} onPageChange={setPage} />
        )}
      </section>
    </div>
  );
}
