'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'agentora-theme';

/**
 * Inline, render-blocking script that resolves the stored (or system) theme and
 * sets the `dark` class on <html> before first paint — so there's no flash of
 * the wrong theme. Injected from the root layout's <head>. Kept dependency-free
 * and stringified so it runs ahead of React hydration.
 */
export const themeScript = `(() => {
  try {
    const stored = localStorage.getItem('${STORAGE_KEY}');
    const theme = stored || 'system';
    const system = matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && system);
    document.documentElement.classList.toggle('dark', dark);
  } catch (_) {}
})();`;

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
} | null>(null);

function applyTheme(theme: Theme) {
  const system = matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && system);
  document.documentElement.classList.toggle('dark', dark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');

  // Hydrate from storage on mount; the no-flash script already set the class.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored) setThemeState(stored);
  }, []);

  // Keep `system` in sync with OS changes while it's the active choice.
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/**
 * Segmented light/dark/system switch. Renders identically on server and client
 * (the active value only changes after mount), so there's no hydration mismatch.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card/60 p-0.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          aria-label={label}
          aria-pressed={theme === value}
          className={`grid size-7 place-items-center rounded-full transition-colors ${
            theme === value
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          key={value}
          onClick={() => setTheme(value)}
          type="button"
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
