import type { TValueOf } from '@blog/config/utils';

export const BLOCKED_IDENTITY_KIND = {
  ADDRESS: 'ADDRESS',
  DOMAIN: 'DOMAIN',
} as const;

export type TBlockedIdentityKind = TValueOf<typeof BLOCKED_IDENTITY_KIND>;
