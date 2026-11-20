import type { TValueOf } from '@shinefold/config/utils';

export const BILLING_INTERVAL = {
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;

export type TBillingInterval = TValueOf<typeof BILLING_INTERVAL>;
