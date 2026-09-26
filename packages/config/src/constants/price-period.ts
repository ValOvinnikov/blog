import type { TValueOf } from '@blog/config/utils';

export const PRICE_PERIOD = {
  ONE_TIME: 'ONE_TIME',
  HOUR: 'HOUR',
  SESSION: 'SESSION',
  MONTH: 'MONTH',
  YEAR: 'YEAR',
} as const;

export type TPricePeriod = TValueOf<typeof PRICE_PERIOD>;
