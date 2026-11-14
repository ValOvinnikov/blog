import type { TValueOf } from '@blog/config/utils';

export const NEWSLETTER_REPUTATION_ALERT_LEVEL = {
  WARN: 'WARN',
  SLOW: 'SLOW',
  STOP: 'STOP',
} as const;

export type TNewsletterReputationAlertLevel = TValueOf<
  typeof NEWSLETTER_REPUTATION_ALERT_LEVEL
>;
