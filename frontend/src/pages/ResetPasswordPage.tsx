import { useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import { useResetPassword } from '@/application/auth/useSession';
import { getErrorMessage } from '@/infrastructure/http/apiError';
import { PasswordInput } from '@/components/molecules/PasswordInput';
import { AuthLayout } from '@/components/templates/AuthLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

/** Mở từ liên kết trong email (?token=...). Đặt xong thì đăng nhập luôn và vào trang chủ. */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const reset = useResetPassword();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && confirm !== password;

  if (reset.isSuccess) return <Navigate to="/" replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!mismatch) reset.mutate({ token, password });
  };

  return (
    <AuthLayout>
      {!token ? (
        <div className="space-y-4 text-center">
          <h1 className="text-xl font-semibold">Liên kết không hợp lệ</h1>
          <p className="text-muted-foreground text-sm">Hãy mở lại liên kết trong email hoặc yêu cầu liên kết mới.</p>
          <Button asChild className="w-full">
            <Link to="/forgot-password">Yêu cầu liên kết mới</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold">Đặt mật khẩu mới</h1>
            <p className="text-muted-foreground text-sm">Mọi thiết bị đang đăng nhập sẽ bị đăng xuất.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reset-password">Mật khẩu mới</Label>
            <PasswordInput
              id="reset-password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">Tối thiểu 8 ký tự.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reset-confirm">Nhập lại mật khẩu</Label>
            <PasswordInput
              id="reset-confirm"
              autoComplete="new-password"
              required
              aria-invalid={mismatch}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {mismatch && <p className="text-destructive text-xs">Mật khẩu nhập lại không khớp.</p>}
          </div>
          {reset.error && (
            <div role="alert" className="bg-destructive/10 text-destructive space-y-1 rounded-md p-3 text-sm">
              <p>{getErrorMessage(reset.error)}</p>
              <Link to="/forgot-password" className="underline underline-offset-4">
                Yêu cầu liên kết mới
              </Link>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={reset.isPending || mismatch}>
            {reset.isPending ? 'Đang lưu…' : 'Đặt mật khẩu'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
