import {
  DEFAULT_PRICE_PERIOD_LABELS,
  PRICE_PERIOD,
  PRICE_PERIOD_LABEL_FIELD,
  type TPricePeriod,
} from '@blog/config/constants';
import { at, defineMigration, setIfMissing } from 'sanity/migrate';

type TSiteSettingsDoc = { pricePeriodLabels?: Record<string, unknown> };

export const backfillPricePeriodLabels = (doc: TSiteSettingsDoc) => {
  const existing = doc.pricePeriodLabels;
  const missing = (Object.values(PRICE_PERIOD) as TPricePeriod[]).filter(
    (period) => existing?.[PRICE_PERIOD_LABEL_FIELD[period]] === undefined,
  );

  if (missing.length === 0) return undefined;

  return [
    at('pricePeriodLabels', setIfMissing({})),
    ...missing.map((period) =>
      at(
        `pricePeriodLabels.${PRICE_PERIOD_LABEL_FIELD[period]}`,
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
