import type { TValueOf } from '@shinefold/config/utils';

export const USAGE_METER = {
  TAKEAWAYS: 'TAKEAWAYS',
  EMAILS: 'EMAILS',
  SEATS: 'SEATS',
  LANGUAGES: 'LANGUAGES',
} as const;

export type TUsageMeter = TValueOf<typeof USAGE_METER>;

export const USAGE_LEVEL = {
  UNDER: 'UNDER',
  NEAR: 'NEAR',
  FULL: 'FULL',
} as const;

export type TUsageLevel = TValueOf<typeof USAGE_LEVEL>;

export const USAGE_LOG = {
  METER_READ_FAILED: 'usage.meter_read_failed',
} as const;

export const USAGE_NEAR_PERCENT = 80;

export const USAGE_CARD_ROW_COUNT = 4;
