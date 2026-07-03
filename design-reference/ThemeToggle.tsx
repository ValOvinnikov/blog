'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export interface ThemeToggleProps {
  /** Extra classes merged onto the button. */
  className?: string;
}

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Light/dark switch.
 *
 * The no-flash inline script in the web app's root layout resolves and applies the
 * theme to `<html>` before React hydrates; this component reads that state on mount
 * and lets the user flip it. The choice is written to `localStorage.theme`
 * (`"light"` | `"dark"`); an absent value means "follow the system preference".
 *
 * Pure and portable: it touches only `document` / `localStorage` and has no
 * `service`, `sanity`, or data-fetching imports, so `@blog/ui` stays extractable.
 *
 * @example
 * <ThemeToggle className="ml-2" />
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    root.classList.toggle('dark', next === 'dark');
    root.style.colorScheme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* localStorage can throw in private mode; the class change still applies */
    }
    setTheme(next);
  }

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-sm',
        'text-text-muted transition-colors duration-[var(--dur-fast)]',
        'hover:bg-surface-2 hover:text-text',
        className ?? '',
      ].join(' ')}
    >
      {mounted ? (
        isDark ? (
          <SunIcon />
        ) : (
          <MoonIcon />
        )
      ) : (
        <span className="block h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
