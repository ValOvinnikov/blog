'use client';

import type { TMaybeNull } from '@shinefold/config';
import { AUTH_QUERY_PARAM } from '@web/constants/sign-in';
import { useEffect, useState } from 'react';

/**
 * Plain `window.location`/`history` access (like `ThemeToggleButton`'s
 * `document.documentElement` read) rather than `next/navigation`'s
 * `useSearchParams`, which would force every page mounting `AuthMenu` (the
 * whole site, via the header) out of static rendering unless wrapped in its
 * own `<Suspense>` boundary.
 */
export const useOAuthErrorParam = (isEnabled = true) => {
  const [error, setError] = useState<TMaybeNull<string>>(null);

  useEffect(() => {
    if (!isEnabled) return;
    const params = new URLSearchParams(window.location.search);
    const value = params.get(AUTH_QUERY_PARAM.ERROR);
    if (!value) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads DOM/URL state set by the OAuth redirect, no external-store subscription to move this into (same pattern as ThemeToggleButton)
    setError(value);

    params.delete(AUTH_QUERY_PARAM.ERROR);
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [isEnabled]);

  return error;
};
