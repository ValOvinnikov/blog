import type { TValueOf } from '@shinefold/config/utils';

export const ALERT_TYPE = {
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  INFO: 'INFO',
} as const;

export type TAlertType = TValueOf<typeof ALERT_TYPE>;
