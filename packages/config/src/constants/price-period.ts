import type { TValueOf } from '@blog/config/utils';

export const PRICE_PERIOD = {
  ONE_TIME: 'ONE_TIME',
  HOUR: 'HOUR',
  SESSION: 'SESSION',
  MONTH: 'MONTH',
  YEAR: 'YEAR',
} as const;

export type TPricePeriod = TValueOf<typeof PRICE_PERIOD>;

export const DEFAULT_PRICE_PERIOD_LABELS = {
  [PRICE_PERIOD.ONE_TIME]: 'one-time',
  [PRICE_PERIOD.HOUR]: 'per hour',
  [PRICE_PERIOD.SESSION]: 'per session',
  [PRICE_PERIOD.MONTH]: 'per month',
  [PRICE_PERIOD.YEAR]: 'per year',
} as const satisfies Record<TPricePeriod, string>;

export const PRICE_PERIOD_LABEL_FIELD = {
  [PRICE_PERIOD.ONE_TIME]: 'oneTime',
  [PRICE_PERIOD.HOUR]: 'hour',
  [PRICE_PERIOD.SESSION]: 'session',
  [PRICE_PERIOD.MONTH]: 'month',
  [PRICE_PERIOD.YEAR]: 'year',
} as const satisfies Record<TPricePeriod, string>;

export type TPricePeriodLabelField = TValueOf<typeof PRICE_PERIOD_LABEL_FIELD>;
