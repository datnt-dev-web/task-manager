import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThemePreference } from '@/domain/entities';

export const THEME_STORAGE_KEY = 'tm-theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

interface ThemeContextValue {
  /** Lựa chọn của người dùng: Sáng / Tối / Theo hệ thống. */
  preference: ThemePreference;
  /** Chế độ thực tế đang hiển thị. */
  resolved: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
  } catch {
    return 'system';
  }
}

/** THM-01..03: áp dụng class `dark` trên <html>, theo dõi thay đổi chế độ của hệ điều hành. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStored);
  const [systemDark, setSystemDark] = useState(() => media().matches);

  useEffect(() => {
    const mq = media();
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* chế độ riêng tư: bỏ qua */
    }
  }, []);

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
