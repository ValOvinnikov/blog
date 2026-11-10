import { PRICE_PERIOD } from '@blog/config';
import type { TSiteSettings } from '@blog/service';

export const MOCK_SITE_SETTINGS: TSiteSettings = {
  currency: 'GBP',
  pricePeriodWording: {
    [PRICE_PERIOD.ONE_TIME]: undefined,
    [PRICE_PERIOD.HOUR]: undefined,
    [PRICE_PERIOD.SESSION]: undefined,
    [PRICE_PERIOD.MONTH]: undefined,
    [PRICE_PERIOD.YEAR]: undefined,
  },
};
