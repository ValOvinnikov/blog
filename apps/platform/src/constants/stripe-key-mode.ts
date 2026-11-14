import type { TValueOf } from '@blog/config/utils';

export const STRIPE_KEY_MODE = {
  TEST: 'test',
  LIVE: 'live',
} as const;

export type TStripeKeyMode = TValueOf<typeof STRIPE_KEY_MODE>;
