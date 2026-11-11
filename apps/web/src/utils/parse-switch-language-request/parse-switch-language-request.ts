import type { TLocaleIsoCode, TMaybeUndefined } from '@blog/config';
import { toInSitePathname } from '@web/utils/to-in-site-pathname';

type TSwitchLanguageRequest = { to: TLocaleIsoCode; from: string };

export const parseSwitchLanguageRequest = (
  searchParams: URLSearchParams,
  liveLocales: readonly TLocaleIsoCode[],
): TMaybeUndefined<TSwitchLanguageRequest> => {
  const to = liveLocales.find((locale) => locale === searchParams.get('to'));
  const from = toInSitePathname(searchParams.get('from'));

  return to && from ? { to, from } : undefined;
};
