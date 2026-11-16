import {
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';

export const orderLocales = (
  defaultLocale: TLocaleIsoCode,
  liveLocales: readonly TLocaleIsoCode[] = Object.values(LOCALE_ISO_CODES),
): TLocaleIsoCode[] => [
  defaultLocale,
  ...liveLocales.filter((locale) => locale !== defaultLocale),
];
