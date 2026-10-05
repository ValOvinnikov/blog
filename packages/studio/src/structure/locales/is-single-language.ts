import type { TLocaleIsoCode } from '@blog/config/constants';

export const isSingleLanguage = (locales: readonly TLocaleIsoCode[]) =>
  locales.length < 2;
