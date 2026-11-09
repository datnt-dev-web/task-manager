import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import type { ThemePreference } from '@/domain/entities';
import { useChangeTheme, useTheme } from '@/application/theme/useTheme';
import { cn } from '@/lib/utils';

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
  { value: 'system', label: 'Hệ thống', icon: Monitor },
];

/** THM-01: chọn Sáng / Tối / Theo hệ thống. */
export function ThemeSwitcher({ className, showLabels = true }: { className?: string; showLabels?: boolean }) {
  const { preference } = useTheme();
  const changeTheme = useChangeTheme();

  return (
    <div role="radiogroup" aria-label="Giao diện" className={cn('bg-muted inline-flex w-full rounded-md p-0.5', className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={preference === value}
          onClick={() => changeTheme(value)}
          title={label}
          className={cn(
            'text-muted-foreground flex flex-1 items-center whitespace-nowrap justify-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium transition-colors',
            preference === value && 'bg-background text-foreground shadow-sm',
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {showLabels && label}
        </button>
      ))}
    </div>
  );
}
