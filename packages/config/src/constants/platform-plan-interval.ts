import type { TValueOf } from '@shinefold/config/utils';

import { PRICE_PERIOD } from './price-period';

export const PLATFORM_PLAN_INTERVAL = {
  MONTH: PRICE_PERIOD.MONTH,
  YEAR: PRICE_PERIOD.YEAR,
  MONTH_AND_YEAR: 'MONTH_AND_YEAR',
} as const;

export type TPlatformPlanInterval = TValueOf<typeof PLATFORM_PLAN_INTERVAL>;
