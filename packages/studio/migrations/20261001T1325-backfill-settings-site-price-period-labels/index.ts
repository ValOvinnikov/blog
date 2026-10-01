import {
  DEFAULT_PRICE_PERIOD_LABELS,
  PRICE_PERIOD,
  type TPricePeriod,
} from '@blog/config/constants';
import { at, defineMigration, setIfMissing } from 'sanity/migrate';

const LABEL_KEY: Record<TPricePeriod, string> = {
  [PRICE_PERIOD.ONE_TIME]: 'oneTime',
  [PRICE_PERIOD.HOUR]: 'hour',
  [PRICE_PERIOD.SESSION]: 'session',
  [PRICE_PERIOD.MONTH]: 'month',
  [PRICE_PERIOD.YEAR]: 'year',
};

type TSiteSettingsDoc = { pricePeriodLabels?: Record<string, unknown> };

export const backfillPricePeriodLabels = (doc: TSiteSettingsDoc) => {
  const existing = doc.pricePeriodLabels;
  const missing = (Object.values(PRICE_PERIOD) as TPricePeriod[]).filter(
    (period) => existing?.[LABEL_KEY[period]] === undefined,
  );

  if (missing.length === 0) return undefined;

  return [
    at('pricePeriodLabels', setIfMissing({})),
    ...missing.map((period) =>
      at(
        `pricePeriodLabels.${LABEL_KEY[period]}`,
        setIfMissing(DEFAULT_PRICE_PERIOD_LABELS[period]),
      ),
    ),
  ];
};

export default defineMigration({
  title: 'Backfill settings_site price period labels',
  documentTypes: ['settings_site'],
  migrate: {
    document(doc) {
      return backfillPricePeriodLabels(doc as TSiteSettingsDoc);
    },
  },
});
