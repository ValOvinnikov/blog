import type { TMaybeUndefined } from '@blog/config';
import { REDIRECT_STATUS } from '@blog/config/constants';
import type { InferResultType } from 'groqd';

import type { redirectsQuery } from './query';
import type { TLandingRedirect } from './types';

export type TRawRedirect = InferResultType<typeof redirectsQuery>[number];

// Browsers read `//host` and `/\host` as protocol-relative URLs to another origin.
const SAME_ORIGIN_PATH = /^\/(?![/\\])/;

function joinPath(destination: string, rest: string): string {
  return destination === '/' ? rest : `${destination}${rest}`;
}

function findRedirect(
  redirects: readonly TRawRedirect[],
  path: string,
): TMaybeUndefined<{ redirect: TRawRedirect; destination: string }> {
  const exact = redirects.find(({ source }) => source === path);
  if (exact) return { redirect: exact, destination: exact.destination };

  const [prefix] = redirects
    .filter(({ source, isPrefix }) => isPrefix && path.startsWith(`${source}/`))
    .sort((a, b) => b.source.length - a.source.length);
  if (!prefix) return undefined;

  return {
    redirect: prefix,
    destination: joinPath(prefix.destination, path.slice(prefix.source.length)),
  };
}

export function toLandingRedirect(
  redirects: readonly TRawRedirect[],
  path: string,
): TMaybeUndefined<TLandingRedirect> {
  const match = findRedirect(redirects, path);
  if (!match || !SAME_ORIGIN_PATH.test(match.destination)) return undefined;

  return {
    destination: match.destination,
    status: match.redirect.status ?? REDIRECT_STATUS.PERMANENT,
  };
}
