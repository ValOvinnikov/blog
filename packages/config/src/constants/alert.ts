import type { TValueOf } from '@blog/config/utils';

export const ALERT_TONE = {
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  INFO: 'INFO',
} as const;

export type TAlertTone = TValueOf<typeof ALERT_TONE>;
