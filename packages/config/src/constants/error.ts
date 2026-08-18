import type { TValueOf } from '@blog/config/utils';

// Namespaced by origin layer (`DB_`) so a log line stays readable without a
// second field identifying where the failure came from. Each member maps to
// a failure `packages/db` (or a query/action layered on it) already
// produces today, whether as a thrown error or a discriminated outcome.
export const ERROR_CODE = {
  DB_NOT_FOUND: 'DB_NOT_FOUND',
  DB_DUPLICATE_SLUG: 'DB_DUPLICATE_SLUG',
  DB_DUPLICATE_DOMAIN: 'DB_DUPLICATE_DOMAIN',
  DB_LAST_LINKED_METHOD: 'DB_LAST_LINKED_METHOD',
} as const;

export type TErrorCode = TValueOf<typeof ERROR_CODE>;
