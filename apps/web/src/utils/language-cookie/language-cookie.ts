import type { TLocaleIsoCode } from '@blog/config';

// next-intl's own locale cookie, so its routing reads the same remembered language.
const LANGUAGE_COOKIE_NAME = 'NEXT_LOCALE';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

type TCookieReader = {
  get: (name: string) => { value: string } | undefined;
};

type TCookieWriter = {
  set: (
    name: string,
    value: string,
    options: { path: string; maxAge: number; sameSite: 'lax' },
  ) => unknown;
};

export const readRememberedLanguage = (
  cookies: TCookieReader,
  liveLocales: readonly TLocaleIsoCode[],
): TLocaleIsoCode | undefined => {
  const value = cookies.get(LANGUAGE_COOKIE_NAME)?.value;
  return liveLocales.find((locale) => locale === value);
};

export const rememberLanguage = (
  cookies: TCookieWriter,
  locale: TLocaleIsoCode,
) => {
  cookies.set(LANGUAGE_COOKIE_NAME, locale, {
    path: '/',
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: 'lax',
  });
};
