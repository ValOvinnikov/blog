import type { TMaybeUndefined } from '@blog/config';
import { adminRoutes } from '@platform/utils/routes/routes';

// Parsed the way a browser parses a Location header, so `//host`, `/\host` and tab-split variants resolve off this origin.
const PARSE_ORIGIN = 'https://platform.invalid';

export const toSafeCallbackPath = (value: TMaybeUndefined<string>): string => {
  if (!value) return adminRoutes.home();

  const { origin, pathname, search, hash } = new URL(value, PARSE_ORIGIN);

  return origin === PARSE_ORIGIN
    ? `${pathname}${search}${hash}`
    : adminRoutes.home();
};
