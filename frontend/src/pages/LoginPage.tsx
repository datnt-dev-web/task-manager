import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';
import { env } from '@/config/env';
import {
  useDevSignIn,
  useGoogleSignIn,
  usePasswordSignIn,
  useRegister,
  useSession,
} from '@/application/auth/useSession';
import { getErrorMessage } from '@/infrastructure/http/apiError';
import { useTheme } from '@/application/theme/useTheme';
import { PageSpinner } from '@/components/atoms/Spinner';
import { AuthLayout } from '@/components/templates/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/molecules/PasswordInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Mode = 'login' | 'register';

/** Đăng nhập / đăng ký bằng email + mật khẩu; Google là một phương thức đăng nhập khác. */
export function LoginPage() {
  const { data: user, isLoading } = useSession();
  const location = useLocation();
  const googleSignIn = useGoogleSignIn();
  const passwordSignIn = usePasswordSignIn();
  const register = useRegister();
  const devSignIn = useDevSignIn();
  const { resolved } = useTheme();
  const [mode, setMode] = useState<Mode>('login');

  if (isLoading) return <PageSpinner />;
  if (user) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/'} replace />;

  const formError = mode === 'login' ? passwordSignIn.error : register.error;
  const error = formError ?? googleSignIn.error ?? devSignIn.error;

  const switchMode = (next: string) => {
    setMode(next as Mode);
    passwordSignIn.reset();
    register.reset();
  };

  return (
    <AuthLayout>
      <div className="space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
          <p className="text-muted-foreground text-sm">
            {mode === 'login' ? 'Chào mừng bạn quay lại.' : 'Đăng ký bằng email để bắt đầu nhận việc.'}
          </p>
        </div>

        <Tabs value={mode} onValueChange={switchMode}>
          <TabsList className="w-full">
            <TabsTrigger value="login">Đăng nhập</TabsTrigger>
            <TabsTrigger value="register">Đăng ký</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-3">
            <LoginForm pending={passwordSignIn.isPending} onSubmit={(input) => passwordSignIn.mutate(input)} />
          </TabsContent>
          <TabsContent value="register" className="pt-3">
            <RegisterForm pending={register.isPending} onSubmit={(input) => register.mutate(input)} />
          </TabsContent>
        </Tabs>

        {error && (
          <p role="alert" className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {getErrorMessage(error)}
          </p>
        )}

        {env.googleClientId && (
          <>
            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <span className="bg-border h-px flex-1" />
              hoặc
              <span className="bg-border h-px flex-1" />
            </div>
            {/*
              Nút Google nằm trong iframe có color-scheme "light". Khi trang ở chế độ tối, trình duyệt
              vẽ nền trắng sau iframe khác color-scheme → ép vùng chứa về light để nền trong suốt.
            */}
            <div className="flex min-h-11 justify-center [color-scheme:light]">
              <GoogleLogin
                onSuccess={({ credential }) => credential && googleSignIn.mutate(credential)}
                onError={() => undefined}
                // Giữ cố định: đổi `text` khiến Google tải lại iframe → nút bị giật khi chuyển tab.
                text="continue_with"
                shape="pill"
                width="320"
                theme={resolved === 'dark' ? 'filled_black' : 'outline'}
              />
            </div>
          </>
        )}

        {env.enableDevLogin && <DevLoginForm pending={devSignIn.isPending} onSubmit={(email) => devSignIn.mutate(email)} />}
      </div>
    </AuthLayout>
  );
}

function LoginForm({ pending, onSubmit }: { pending: boolean; onSubmit: (input: { email: string; password: string }) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ email: email.trim(), password });
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Mật khẩu</Label>
          <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </Button>
    </form>
  );
}

function RegisterForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (input: { fullName: string; email: string; password: string }) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mismatch) return;
    onSubmit({ fullName: fullName.trim(), email: email.trim(), password });
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="reg-name">Họ tên</Label>
        <Input id="reg-name" autoComplete="name" required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-email">Email</Label>
        <Input id="reg-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-password">Mật khẩu</Label>
        <PasswordInput
          id="reg-password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">Tối thiểu 8 ký tự.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-confirm">Nhập lại mật khẩu</Label>
        <PasswordInput
          id="reg-confirm"
          autoComplete="new-password"
          required
          aria-invalid={mismatch}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {mismatch && <p className="text-destructive text-xs">Mật khẩu nhập lại không khớp.</p>}
      </div>
      <Button type="submit" className="w-full" disabled={pending || mismatch}>
        {pending ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
      </Button>
    </form>
  );
}

function DevLoginForm({ pending, onSubmit }: { pending: boolean; onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) onSubmit(email.trim());
  };
  return (
    <form onSubmit={submit} className="space-y-2 border-t pt-4">
      <Label htmlFor="dev-email" className="text-muted-foreground text-xs">
        Chỉ dùng khi phát triển: đăng nhập nhanh bằng email (không cần mật khẩu)
      </Label>
      <div className="flex gap-2">
        <Input id="dev-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
        <Button type="submit" variant="outline" disabled={pending}>
          Vào
        </Button>
      </div>
    </form>
  );
}
