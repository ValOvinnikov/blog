import type { TValueOf } from '@shinefold/config/utils';

export const METER_TONE = {
  BRAND: 'BRAND',
  WARN: 'WARN',
  BAD: 'BAD',
} as const;

export type TMeterTone = TValueOf<typeof METER_TONE>;
