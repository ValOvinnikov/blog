import type { TLocaleIsoCode, TMaybeUndefined } from '@blog/config';
import { ONE_YEAR_IN_SECONDS } from '@web/constants/time';

export const LANGUAGE_COOKIE_NAME = 'NEXT_LOCALE';

type TCookieReader = {
  get: (name: string) => TMaybeUndefined<{ value: string }>;
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
): TMaybeUndefined<TLocaleIsoCode> => {
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
