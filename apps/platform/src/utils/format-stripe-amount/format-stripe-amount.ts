import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config';

const MINOR_UNITS_PER_MAJOR = 100;

export type TStripeAmount = {
  minorUnits: number;
  currency: string;
};

export const formatStripeAmount = (
  { minorUnits, currency }: TStripeAmount,
  locale: TLocaleIsoCode,
): string =>
  new Intl.NumberFormat(LOCALE_BCP47_TAGS[locale], {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(minorUnits / MINOR_UNITS_PER_MAJOR);
