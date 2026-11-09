import { useState, type FormEvent } from 'react';
import { useChangePassword } from '@/application/auth/useSession';
import { notify } from '@/application/notify';
import { PasswordInput } from '@/components/molecules/PasswordInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

/**
 * Cài đặt → Mật khẩu. Tài khoản chỉ dùng Google: "Đặt mật khẩu" (không cần mật khẩu cũ).
 * Đã có mật khẩu: "Đổi mật khẩu" (bắt buộc mật khẩu hiện tại). Các thiết bị khác bị đăng xuất.
 */
export function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && confirm !== next;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mismatch) return;
    change.mutate(
      { currentPassword: hasPassword ? current : undefined, newPassword: next },
      {
        onSuccess: () => {
          notify.success(hasPassword ? 'Đã đổi mật khẩu' : 'Đã đặt mật khẩu, giờ bạn có thể đăng nhập bằng email');
          setCurrent('');
          setNext('');
          setConfirm('');
        },
        onError: (error) => notify.error(error),
      },
    );
  };

  return (
    <section className="bg-card mx-4 space-y-3 rounded-lg border p-4 md:mx-6" aria-labelledby="password-heading">
      <div className="space-y-1">
        <h2 id="password-heading" className="text-sm font-semibold">
          {hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
        </h2>
        <p className="text-muted-foreground text-xs">
          {hasPassword
            ? 'Sau khi đổi, các thiết bị khác sẽ bị đăng xuất.'
            : 'Tài khoản của bạn đang chỉ đăng nhập bằng Google. Đặt mật khẩu để đăng nhập được bằng email.'}
        </p>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:max-w-sm">
        {hasPassword && (
          <div className="space-y-1.5">
            <Label htmlFor="pw-current">Mật khẩu hiện tại</Label>
            <PasswordInput
              id="pw-current"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="pw-new">Mật khẩu mới</Label>
          <PasswordInput
            id="pw-new"
            autoComplete="new-password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">Tối thiểu 8 ký tự.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw-confirm">Nhập lại mật khẩu mới</Label>
          <PasswordInput
            id="pw-confirm"
            autoComplete="new-password"
            required
            aria-invalid={mismatch}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {mismatch && <p className="text-destructive text-xs">Mật khẩu nhập lại không khớp.</p>}
        </div>
        <Button type="submit" className="w-fit" disabled={change.isPending || mismatch}>
          {change.isPending ? 'Đang lưu…' : hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
        </Button>
      </form>
    </section>
  );
}
