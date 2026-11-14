export const CACHE_CONTROL = {
  PRIVATE_NO_STORE: 'private, no-store',
  PUBLIC_ONE_MINUTE: 'public, max-age=60, s-maxage=60',
} as const;

export const ROBOTS_DIRECTIVE = {
  NOINDEX: 'noindex',
} as const;
