import { PRICE_PERIOD } from '@blog/config';
import { q } from '@blog/service/sanity/query/query';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

export const siteSettingsQuery = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('settings_site')
  .slice(0)
  .project((sub) => ({
    currency: sub.field('currency').notNull(),
    pricePeriodSuffix: sub
      .field('pricePeriodSuffix')
      .project((wording) => ({
        [PRICE_PERIOD.ONE_TIME]: getLocalizedField(
          wording,
          PRICE_PERIOD.ONE_TIME,
        ),
        [PRICE_PERIOD.HOUR]: getLocalizedField(wording, PRICE_PERIOD.HOUR),
        [PRICE_PERIOD.SESSION]: getLocalizedField(
          wording,
          PRICE_PERIOD.SESSION,
        ),
        [PRICE_PERIOD.MONTH]: getLocalizedField(wording, PRICE_PERIOD.MONTH),
        [PRICE_PERIOD.YEAR]: getLocalizedField(wording, PRICE_PERIOD.YEAR),
      }))
      .nullable(true),
  }))
  .notNull();
