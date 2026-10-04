import {
  LOCALE_ISO_CODES,
  PRICE_PERIOD,
  type TPricePeriod,
} from '@blog/config/constants';
import { at, defineMigration, setIfMissing } from 'sanity/migrate';

const { EN } = LOCALE_ISO_CODES;

// A snapshot of the English UI catalogue this field replaces; the catalogue keys are retired afterwards.
const ENGLISH_PRICE_PERIOD_WORDING: Record<TPricePeriod, string> = {
  [PRICE_PERIOD.ONE_TIME]: 'one-time',
  [PRICE_PERIOD.HOUR]: 'per hour',
  [PRICE_PERIOD.SESSION]: 'per session',
  [PRICE_PERIOD.MONTH]: 'per month',
  [PRICE_PERIOD.YEAR]: 'per year',
};

const inEnglish = (value: string) => [
  { _key: EN, _type: 'internationalizedArrayStringValue', language: EN, value },
];

export const seedPricePeriodWording = (doc: { pricePeriodSuffix?: unknown }) =>
  doc.pricePeriodSuffix === undefined
    ? [
        at(
          'pricePeriodSuffix',
          setIfMissing(
            Object.fromEntries(
              Object.values(PRICE_PERIOD).map((period) => [
                period,
                inEnglish(ENGLISH_PRICE_PERIOD_WORDING[period]),
              ]),
            ),
          ),
        ),
      ]
    : undefined;

export default defineMigration({
  title: 'Seed Site Settings price period wording in English',
  documentTypes: ['settings_site'],
  migrate: {
    document(doc) {
      return seedPricePeriodWording(doc as { pricePeriodSuffix?: unknown });
    },
  },
});
