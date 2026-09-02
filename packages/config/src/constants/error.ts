import type { TValueOf } from '@blog/config/utils';

// Namespaced by origin layer (`DB_`) so a log line stays readable without a
// second field identifying where the failure came from.
export const ERROR_CODE = {
  DB_NOT_FOUND: 'DB_NOT_FOUND',
  DB_DUPLICATE_DOMAIN: 'DB_DUPLICATE_DOMAIN',
  DB_DUPLICATE_SLUG: 'DB_DUPLICATE_SLUG',
  DB_LAST_LINKED_METHOD: 'DB_LAST_LINKED_METHOD',
  DB_ALREADY_PROVISIONING: 'DB_ALREADY_PROVISIONING',
  DB_INVALID_DOMAIN: 'DB_INVALID_DOMAIN',
} as const;

export type TErrorCode = TValueOf<typeof ERROR_CODE>;
