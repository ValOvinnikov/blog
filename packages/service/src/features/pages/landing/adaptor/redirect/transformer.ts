import type { TMaybeUndefined } from '@blog/config';
import type { InferResultType } from 'groqd';

import type { redirectsQuery } from './query';

export type TRawRedirect = InferResultType<typeof redirectsQuery>[number];

// Browsers read `//host` and `/\host` as protocol-relative URLs to another origin.
const SAME_ORIGIN_PATH = /^\/(?![/\\])/;

function joinPath(destination: string, rest: string): string {
  return destination === '/' ? rest : `${destination}${rest}`;
}

function findDestination(
  redirects: readonly TRawRedirect[],
  path: string,
): TMaybeUndefined<string> {
  const exact = redirects.find(({ source }) => source === path);
  if (exact) return exact.destination;

  const [prefix] = redirects
    .filter(({ source, isPrefix }) => isPrefix && path.startsWith(`${source}/`))
    .sort((a, b) => b.source.length - a.source.length);
  if (!prefix) return undefined;

  return joinPath(prefix.destination, path.slice(prefix.source.length));
}

export function toRedirectDestination(
  redirects: readonly TRawRedirect[],
  path: string,
): TMaybeUndefined<string> {
  const destination = findDestination(redirects, path);
  return destination && SAME_ORIGIN_PATH.test(destination)
    ? destination
    : undefined;
}
