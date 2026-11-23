import type { TValueOf } from '@shinefold/config/utils';

export const BILLING_GRACE = {
  START: 'START',
  END: 'END',
  KEEP: 'KEEP',
} as const;

export type TBillingGrace = TValueOf<typeof BILLING_GRACE>;
