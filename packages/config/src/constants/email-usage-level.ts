import type { TValueOf } from '@shinefold/config/utils';

export const EMAIL_USAGE_LEVEL = {
  NORMAL: 'NORMAL',
  NEAR: 'NEAR',
  OVER: 'OVER',
} as const;

export type TEmailUsageLevel = TValueOf<typeof EMAIL_USAGE_LEVEL>;
