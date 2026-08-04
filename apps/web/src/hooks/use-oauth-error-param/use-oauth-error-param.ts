'use client';

import { useEffect, useState } from 'react';

const ERROR_PARAM = 'error';

/**
 * useOAuthErrorParam — reads Auth.js's `?error=` redirect param (set by
 * `pages.error` in `@web/server/auth/auth.ts`) once on mount, then strips it
 * from the URL bar via `history.replaceState` so a refresh or a shared link
 * doesn't keep re-surfacing a stale notice. Plain `window.location`/`history`
 * access (like `ThemeToggleButton`'s `document.documentElement` read) rather
 * than `next/navigation`'s `useSearchParams`, which would force every page
 * mounting `AuthMenu` (the whole site, via the header) out of static
 * rendering unless wrapped in its own `<Suspense>` boundary.
 */
export const useOAuthErrorParam = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(ERROR_PARAM);
    if (!value) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads DOM/URL state set by the OAuth redirect, no external-store subscription to move this into (same pattern as ThemeToggleButton)
    setError(value);

    params.delete(ERROR_PARAM);
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, []);

  return error;
};
