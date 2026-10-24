import type { TValueOf } from '@blog/config/utils';

export const PERSONAL_DATA_OWNER = {
  USER: 'USER',
  LEAD: 'LEAD',
  SUBSCRIBER: 'SUBSCRIBER',
  INVITE: 'INVITE',
} as const;

export type TPersonalDataOwner = TValueOf<typeof PERSONAL_DATA_OWNER>;

export const PERSONAL_DATA_FALLBACK_REASON = {
  NOT_BACKFILLED: 'NOT_BACKFILLED',
  ENCRYPTION_KEY_UNSET: 'ENCRYPTION_KEY_UNSET',
  INDEX_KEY_UNSET: 'INDEX_KEY_UNSET',
} as const;

export type TPersonalDataFallbackReason = TValueOf<
  typeof PERSONAL_DATA_FALLBACK_REASON
>;
