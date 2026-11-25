import type { TValueOf } from '@shinefold/config/utils';

export const PLATFORM_PLAN_INTERVAL = {
  MONTH: 'MONTH',
  YEAR: 'YEAR',
  MONTH_AND_YEAR: 'MONTH_AND_YEAR',
} as const;

export type TPlatformPlanInterval = TValueOf<typeof PLATFORM_PLAN_INTERVAL>;
