import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EmailSettings, User } from '@/domain/entities';
import { EMAIL_SETTING_LABELS } from '@/domain/rules/notification.rules';
import { useCurrentUser } from '@/application/auth/useCurrentUser';
import { notify } from '@/application/notify';
import { queryKeys } from '@/application/queryKeys';
import { userApi, type UpdateProfileInput } from '@/infrastructure/api/user.api';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { ThemeSwitcher } from '@/components/molecules/ThemeSwitcher';
import { PageHeader } from '@/components/templates/PageHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => userApi.updateMe(input),
    onSuccess: (user) => queryClient.setQueryData<User | null>(queryKeys.session, user),
    onError: (error) => notify.error(error),
  });
}

/** AUTH-05, THM-01, NTF-03: hồ sơ, giao diện, email thông báo. */
export function SettingsPage() {
  const user = useCurrentUser();
  const update = useUpdateProfile();
  const [fullName, setFullName] = useState(user.fullName ?? '');
  const [title, setTitle] = useState(user.title ?? '');

  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    update.mutate(
      { fullName: fullName.trim() || undefined, title: title.trim() || null },
      { onSuccess: () => notify.success('Đã lưu hồ sơ') },
    );
  };

  const toggleEmail = (key: keyof EmailSettings, value: boolean) => update.mutate({ emailSettings: { [key]: value } });

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-10">
      <PageHeader title="Cài đặt cá nhân" />

      <section className="bg-card mx-4 space-y-4 rounded-lg border p-4 md:mx-6" aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="text-sm font-semibold">
          Hồ sơ
        </h2>
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="lg" />
          <div className="text-sm">
            <p className="font-medium">{user.email}</p>
            <p className="text-muted-foreground text-xs">Ảnh đại diện lấy từ tài khoản Google</p>
          </div>
        </div>
        <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="full-name">Tên hiển thị</Label>
            <Input id="full-name" maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-title">Chức danh</Label>
            <Input id="job-title" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Nhân viên Marketing" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={update.isPending || !fullName.trim()}>
              Lưu hồ sơ
            </Button>
          </div>
        </form>
      </section>

      <section className="bg-card mx-4 space-y-3 rounded-lg border p-4 md:mx-6" aria-labelledby="theme-heading">
        <h2 id="theme-heading" className="text-sm font-semibold">
          Giao diện
        </h2>
        <ThemeSwitcher className="max-w-sm" />
        <p className="text-muted-foreground text-xs">Lựa chọn được lưu vào tài khoản, dùng máy khác vẫn giữ nguyên.</p>
      </section>

      <section className="bg-card mx-4 space-y-3 rounded-lg border p-4 md:mx-6" aria-labelledby="email-heading">
        <div>
          <h2 id="email-heading" className="text-sm font-semibold">
            Email thông báo
          </h2>
          <p className="text-muted-foreground text-xs">Thông báo trong ứng dụng (chuông) luôn bật.</p>
        </div>
        <ul className="space-y-2.5">
          {(Object.keys(EMAIL_SETTING_LABELS) as (keyof EmailSettings)[]).map((key) => (
            <li key={key} className="flex items-center gap-2">
              <Checkbox
                id={`email-${key}`}
                checked={user.emailSettings?.[key] !== false}
                onCheckedChange={(checked) => toggleEmail(key, checked === true)}
              />
              <Label htmlFor={`email-${key}`} className="font-normal">
                {EMAIL_SETTING_LABELS[key]}
              </Label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
