import 'server-only';

import type { TMaybeUndefined } from '@shinefold/config';
import { headers } from 'next/headers';

// A client navigation fetches the next page from the current one, so its Referer names the page Help was opened from.
export const readHelpOrigin = async (
  helpPath: string,
): Promise<TMaybeUndefined<string>> => {
  const requestHeaders = await headers();
  const referer = requestHeaders.get('referer');
  const host = requestHeaders.get('host');
  if (!referer || !host) return undefined;

  try {
    const { host: refererHost, pathname, search } = new URL(referer);
    return refererHost === host && pathname !== helpPath
      ? `${pathname}${search}`
      : undefined;
  } catch {
    return undefined;
  }
};
