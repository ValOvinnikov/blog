'use client';

import { ThemeToggle } from '@blog/ui/components/atoms/theme-toggle';
import { headerControlVariants } from '@web/components/shared/header-control';
import { THEME_STORAGE_KEY } from '@web/config/theme-script';
import { useEffect, useState } from 'react';

export const ThemeToggleButton = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Reads DOM state set by a pre-hydration inline script to avoid an SSR/client
    // mismatch; there is no external-store subscription to move this into.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const handleToggle = () => {
    const next = isDark ? 'light' : 'dark';

    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage can throw in private browsing; the theme still applies for this page.
    }

    setIsDark(next === 'dark');
  };

  return (
    <ThemeToggle
      isDark={isDark}
      onToggle={handleToggle}
      isIconFromThemeClass={true}
      className={headerControlVariants({ shape: 'square' })}
    />
  );
};
