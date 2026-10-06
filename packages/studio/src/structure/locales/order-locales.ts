import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';

export const orderLocales = (
  defaultLocale: TLocaleIsoCode,
  liveLocales: readonly TLocaleIsoCode[] = Object.values(LOCALE_ISO_CODES),
): TLocaleIsoCode[] => [
  defaultLocale,
  ...liveLocales.filter((locale) => locale !== defaultLocale),
];
