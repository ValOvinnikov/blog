import type { TLocaleIsoCode } from '@blog/config';

type TSwitchLanguageRequest = { to: TLocaleIsoCode; from: string };

const SITE_ORIGIN_PROBE = 'https://site.invalid';

const toInSitePathname = (from: string | null): string | undefined => {
  if (!from?.startsWith('/')) {
    return undefined;
  }
  const url = new URL(from, SITE_ORIGIN_PROBE);
  return url.origin === SITE_ORIGIN_PROBE ? url.pathname : undefined;
};

export const parseSwitchLanguageRequest = (
  searchParams: URLSearchParams,
  liveLocales: readonly TLocaleIsoCode[],
): TSwitchLanguageRequest | undefined => {
  const to = liveLocales.find((locale) => locale === searchParams.get('to'));
  const from = toInSitePathname(searchParams.get('from'));

  return to && from ? { to, from } : undefined;
};
