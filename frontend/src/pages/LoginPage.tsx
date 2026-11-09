import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';
import { env } from '@/config/env';
import { useDevSignIn, useGoogleSignIn, useSession } from '@/application/auth/useSession';
import { getErrorMessage } from '@/infrastructure/http/apiError';
import { useTheme } from '@/application/theme/useTheme';
import { PageSpinner } from '@/components/atoms/Spinner';
import { AuthLayout } from '@/components/templates/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** AUTH-01/02: chỉ một nút "Đăng nhập bằng Google". */
export function LoginPage() {
  const { data: user, isLoading } = useSession();
  const location = useLocation();
  const googleSignIn = useGoogleSignIn();
  const devSignIn = useDevSignIn();
  const { resolved } = useTheme();
  const [email, setEmail] = useState('');

  if (isLoading) return <PageSpinner />;
  if (user) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/'} replace />;

  const error = googleSignIn.error ?? devSignIn.error;

  const submitDev = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) devSignIn.mutate(email.trim());
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">Đăng nhập</h1>
          <p className="text-muted-foreground text-sm">Dùng tài khoản Google đã được quản trị viên cấp quyền.</p>
        </div>

        {env.googleClientId ? (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={({ credential }) => credential && googleSignIn.mutate(credential)}
              onError={() => undefined}
              text="signin_with"
              shape="pill"
              theme={resolved === 'dark' ? 'filled_black' : 'outline'}
            />
          </div>
        ) : (
          <p className="bg-muted text-muted-foreground rounded-md p-3 text-center text-xs">
            Chưa cấu hình VITE_GOOGLE_CLIENT_ID nên chưa hiện nút Google.
          </p>
        )}

        {error && (
          <p role="alert" className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {getErrorMessage(error)}
          </p>
        )}

        {env.enableDevLogin && (
          <form onSubmit={submitDev} className="space-y-2 border-t pt-4">
            <Label htmlFor="dev-email" className="text-muted-foreground text-xs">
              Chỉ dùng khi phát triển: đăng nhập bằng email
            </Label>
            <div className="flex gap-2">
              <Input id="dev-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
              <Button type="submit" variant="outline" disabled={devSignIn.isPending}>
                Vào
              </Button>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
