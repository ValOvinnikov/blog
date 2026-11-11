import type { TValueOf } from '@blog/config/utils';

export const EMAIL_DELIVERY_OUTCOME = {
  DELIVERED: 'DELIVERED',
  BOUNCED: 'BOUNCED',
  COMPLAINED: 'COMPLAINED',
} as const;

export type TEmailDeliveryOutcome = TValueOf<typeof EMAIL_DELIVERY_OUTCOME>;

export const EMAIL_REPUTATION_WINDOW_DAYS = 7;
