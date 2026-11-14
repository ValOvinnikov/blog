import type { TLocaleIsoCode, TMaybeUndefined } from '@blog/config';
import { REMEMBERED_COOKIE_OPTIONS } from '@web/utils/remembered-cookie-options';

export const LANGUAGE_COOKIE_NAME = 'NEXT_LOCALE';

type TCookieReader = {
  get: (name: string) => TMaybeUndefined<{ value: string }>;
};

type TCookieWriter = {
  set: (
    name: string,
    value: string,
    options: typeof REMEMBERED_COOKIE_OPTIONS,
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
  cookies.set(LANGUAGE_COOKIE_NAME, locale, REMEMBERED_COOKIE_OPTIONS);
};
