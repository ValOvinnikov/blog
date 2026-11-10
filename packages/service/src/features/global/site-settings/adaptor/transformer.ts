import { PRICE_PERIOD } from '@blog/config';
import type { InferResultType } from 'groqd';

import type { siteSettingsQuery } from './query';
import type { TSiteSettings } from './types';

export type TRawSiteSettings = NonNullable<
  InferResultType<typeof siteSettingsQuery>
>;

export function toSiteSettings(raw: TRawSiteSettings): TSiteSettings {
  const { currency, pricePeriodSuffix } = raw;
  return {
    currency,
    pricePeriodWording: {
      [PRICE_PERIOD.ONE_TIME]: pricePeriodSuffix?.ONE_TIME ?? undefined,
      [PRICE_PERIOD.HOUR]: pricePeriodSuffix?.HOUR ?? undefined,
      [PRICE_PERIOD.SESSION]: pricePeriodSuffix?.SESSION ?? undefined,
      [PRICE_PERIOD.MONTH]: pricePeriodSuffix?.MONTH ?? undefined,
      [PRICE_PERIOD.YEAR]: pricePeriodSuffix?.YEAR ?? undefined,
    },
  };
}
