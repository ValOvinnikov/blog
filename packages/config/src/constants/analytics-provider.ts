import type { TValueOf } from '@blog/config/utils';

export const ANALYTICS_PROVIDER = {
  GOOGLE_ANALYTICS: 'GOOGLE_ANALYTICS',
  PLAUSIBLE: 'PLAUSIBLE',
} as const;

export type TAnalyticsProvider = TValueOf<typeof ANALYTICS_PROVIDER>;
