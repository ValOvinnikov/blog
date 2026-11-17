import 'server-only';

import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { HTTP_STATUS, type TMaybeUndefined } from '@shinefold/config';
import { safeAsync } from '@shinefold/utils';
import { unstable_cache } from 'next/cache';

// A slug change in the marketing Studio reaches the links within this window.
const LEGAL_PAGE_ADDRESS_REVALIDATE_SECONDS = 600;
const LEGAL_PAGE_FETCH_TIMEOUT_MS = 5000;

const REDIRECT_STATUSES: ReadonlySet<number> = new Set([
  HTTP_STATUS.MOVED_PERMANENTLY,
  HTTP_STATUS.SEE_OTHER,
  HTTP_STATUS.TEMPORARY_REDIRECT,
]);

const fetchFinalAddress = async (redirectHref: string): Promise<string> => {
  const redirectUrl = new URL(redirectHref);
  const response = await fetch(redirectUrl, {
    redirect: 'manual',
    signal: AbortSignal.timeout(LEGAL_PAGE_FETCH_TIMEOUT_MS),
    cache: 'no-store',
  });
  const location = response.headers.get('location');
  if (!REDIRECT_STATUSES.has(response.status) || !location) {
    throw new Error(`Legal page redirect answered ${response.status}`);
  }

  const target = new URL(location, redirectUrl);
  if (target.origin !== redirectUrl.origin) {
    throw new Error(`Legal page redirect left ${redirectUrl.origin}`);
  }
  return target.href;
};

// A thrown lookup is never cached, so a failure is retried on the next render.
const getFinalAddress = safeAsync(
  unstable_cache(fetchFinalAddress, ['legal-page-address'], {
    revalidate: LEGAL_PAGE_ADDRESS_REVALIDATE_SECONDS,
  }),
);

const resolveLegalPageUrl = async (redirectHref: string): Promise<string> => {
  const result = await getFinalAddress(redirectHref);
  return result.ok ? result.data : redirectHref;
};

export const resolveLegalPageUrls = async (
  urls: TMaybeUndefined<TLegalPageUrls>,
): Promise<TMaybeUndefined<TLegalPageUrls>> => {
  if (!urls) return undefined;

  const [terms, privacy] = await Promise.all([
    resolveLegalPageUrl(urls.terms),
    resolveLegalPageUrl(urls.privacy),
  ]);
  return { terms, privacy };
};
