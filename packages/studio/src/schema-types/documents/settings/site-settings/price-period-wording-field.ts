import { PRICE_PERIOD, type TPricePeriod } from '@blog/config/constants';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { PRICING_PERIOD_TITLE } from '@blog/studio/schema-types/objects/pricing-price/pricing-price';
import { defineField } from 'sanity';

const PRICE_PERIOD_WORDING_DESCRIPTION: Record<TPricePeriod, string> = {
  [PRICE_PERIOD.ONE_TIME]: 'Shown after a one-time price, e.g. “one-time”.',
  [PRICE_PERIOD.HOUR]: 'Shown after an hourly price, e.g. “/hour”.',
  [PRICE_PERIOD.SESSION]: 'Shown after a per-session price, e.g. “/session”.',
  [PRICE_PERIOD.MONTH]: 'Shown after a monthly price, e.g. “/month”.',
  [PRICE_PERIOD.YEAR]: 'Shown after a yearly price, e.g. “/year”.',
};

export const pricePeriodWordingField = defineField({
  name: 'pricePeriodSuffix',
  title: 'Price Period Wording',
  type: 'object',
  description:
    'How each billing period reads after a price on every Pricing module on the site, in the reader’s language. Where a period is left empty, the built-in wording shows.',
  options: { collapsible: true, collapsed: true },
  fields: Object.values(PRICE_PERIOD).map((period) =>
    localizedOneLineTextField({
      name: period,
      title: PRICING_PERIOD_TITLE[period],
      description: PRICE_PERIOD_WORDING_DESCRIPTION[period],
    }),
  ),
});
