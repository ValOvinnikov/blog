'use client';

import type { IWithDataTestId } from '@blog/config';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '../../utils/cn';
import {
  themeTogglePlaceholderVariants,
  themeToggleVariants,
} from './theme-toggle-variants';

export interface IThemeToggleProps extends IWithDataTestId {
  className?: string;
  lightLabel?: string;
  darkLabel?: string;
}

type TTheme = 'light' | 'dark';

const readTheme = (): TTheme => {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

export const ThemeToggle = ({
  className,
  dataTestId,
  lightLabel = 'Switch to light theme',
  darkLabel = 'Switch to dark theme',
}: IThemeToggleProps) => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<TTheme>('light');

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: TTheme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    root.classList.toggle('dark', next === 'dark');
    root.style.colorScheme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // localStorage can throw in private mode; the class change still applies
    }
    setTheme(next);
  };

  const isDark = theme === 'dark';
  const label = isDark ? lightLabel : darkLabel;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      data-testid={dataTestId}
      className={cn(themeToggleVariants(), className)}
    >
      {mounted ? (
        isDark ? (
          <Sun size={18} strokeWidth={1.6} aria-hidden="true" />
        ) : (
          <Moon size={18} strokeWidth={1.6} aria-hidden="true" />
        )
      ) : (
        <span className={themeTogglePlaceholderVariants()} aria-hidden="true" />
      )}
    </button>
  );
};
