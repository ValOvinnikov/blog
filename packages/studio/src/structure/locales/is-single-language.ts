import type { TLocaleIsoCode } from '@shinefold/config/constants';

export const isSingleLanguage = (locales: readonly TLocaleIsoCode[]) =>
  locales.length < 2;
