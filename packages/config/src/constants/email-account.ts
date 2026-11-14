import type { TValueOf } from '@blog/config/utils';

export const EMAIL_ACCOUNT = {
  PLATFORM: 'PLATFORM',
  TENANT: 'TENANT',
} as const;

export type TEmailAccount = TValueOf<typeof EMAIL_ACCOUNT>;
