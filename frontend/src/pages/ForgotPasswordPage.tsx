import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { MailCheck } from 'lucide-react';
import { useForgotPassword } from '@/application/auth/useSession';
import { getErrorMessage } from '@/infrastructure/http/apiError';
import { AuthLayout } from '@/components/templates/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Quên mật khẩu: gửi liên kết đặt lại qua email. Luôn báo "đã gửi" để không lộ email nào có tài khoản. */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const forgot = useForgotPassword();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    forgot.mutate(email.trim());
  };

  return (
    <AuthLayout>
      {forgot.isSuccess ? (
        <div className="space-y-4 text-center">
          <MailCheck className="text-primary mx-auto size-10" aria-hidden />
          <h1 className="text-xl font-semibold">Kiểm tra email của bạn</h1>
          <p className="text-muted-foreground text-sm">
            Nếu <strong className="text-foreground">{email.trim()}</strong> có tài khoản, chúng tôi đã gửi liên kết đặt lại mật
            khẩu. Liên kết hết hạn sau 30 phút.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Quay lại đăng nhập</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold">Quên mật khẩu</h1>
            <p className="text-muted-foreground text-sm">Nhập email đăng nhập, chúng tôi sẽ gửi liên kết để đặt mật khẩu mới.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="forgot-email">Email</Label>
            <Input id="forgot-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {forgot.error && (
            <p role="alert" className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {getErrorMessage(forgot.error)}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={forgot.isPending}>
            {forgot.isPending ? 'Đang gửi…' : 'Gửi liên kết'}
          </Button>
          <p className="text-center text-sm">
            <Link to="/login" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              Quay lại đăng nhập
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
