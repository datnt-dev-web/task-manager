import type { ReactNode } from 'react';
import { AppLogo } from '@/components/atoms/AppLogo';
import { ThemeSwitcher } from '@/components/molecules/ThemeSwitcher';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <div className="absolute top-4 right-4 w-64">
        <ThemeSwitcher />
      </div>
      <AppLogo className="text-lg" />
      <div className="bg-card w-full max-w-sm rounded-xl border p-6 shadow-sm">{children}</div>
      <p className="text-muted-foreground text-xs">Hệ thống giao việc nội bộ</p>
    </div>
  );
}
