import type { TMaybeUndefined } from '@blog/config';
import { adminRoutes } from '@platform/utils/routes/routes';

// Parsed the way a browser parses a Location header, so `//host`, `/\host` and tab-split variants resolve off this origin.
const PARSE_ORIGIN = 'https://platform.invalid';

// Parsing collapses dot segments, so `/.//host` comes back as the protocol-relative `//host`.
const PROTOCOL_RELATIVE_PREFIX = /^[/\\]{2}/;

export const toSafeCallbackPath = (value: TMaybeUndefined<string>): string => {
  if (!value) return adminRoutes.home();

  const { origin, pathname, search, hash } = new URL(value, PARSE_ORIGIN);
  const path = `${pathname}${search}${hash}`;

  return origin === PARSE_ORIGIN && !PROTOCOL_RELATIVE_PREFIX.test(path)
    ? path
    : adminRoutes.home();
};
