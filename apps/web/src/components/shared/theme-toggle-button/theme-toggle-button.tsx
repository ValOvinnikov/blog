'use client';

import { ThemeToggle } from '@blog/ui/components/atoms/theme-toggle';
import { useEffect, useState } from 'react';

export const ThemeToggleButton = () => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Reads DOM state set by a pre-hydration inline script to avoid an SSR/client
    // mismatch; there is no external-store subscription to move this into.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains('dark'));
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const next = isDark ? 'light' : 'dark';

    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;

    try {
      localStorage.setItem('theme', next);
    } catch {
      // localStorage can throw in private browsing; the class change above
      // still applies even if persistence fails.
    }

    setIsDark(next === 'dark');
  };

  return (
    <ThemeToggle isDark={isDark} onToggle={handleToggle} isMounted={mounted} />
  );
};
