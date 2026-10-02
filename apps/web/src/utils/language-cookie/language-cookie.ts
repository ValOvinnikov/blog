import type { TLocaleIsoCode } from '@blog/config';

// next-intl's own locale cookie, so its routing reads the same remembered language.
const LANGUAGE_COOKIE_NAME = 'NEXT_LOCALE';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export const rememberLanguage = (locale: TLocaleIsoCode) => {
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${locale}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
};
