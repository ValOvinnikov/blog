import type { TMaybeNull, TMaybeUndefined } from '@blog/config';

const SITE_ORIGIN_PROBE = 'https://site.invalid';

export const toInSitePathname = (
  path: TMaybeNull<string>,
): TMaybeUndefined<string> => {
  if (!path?.startsWith('/')) {
    return undefined;
  }
  const url = new URL(path, SITE_ORIGIN_PROBE);
  return url.origin === SITE_ORIGIN_PROBE ? url.pathname : undefined;
};
