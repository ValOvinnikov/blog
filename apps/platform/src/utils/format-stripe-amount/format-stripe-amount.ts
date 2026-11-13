import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config';

const DECIMAL_BASE = 10;

export type TStripeAmount = {
  minorUnits: number;
  currency: string;
};

export const formatStripeAmount = (
  { minorUnits, currency }: TStripeAmount,
  locale: TLocaleIsoCode,
): string => {
  const formatter = new Intl.NumberFormat(LOCALE_BCP47_TAGS[locale], {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  const { maximumFractionDigits = 0 } = formatter.resolvedOptions();

  return formatter.format(minorUnits / DECIMAL_BASE ** maximumFractionDigits);
};
