import { routes, type TLocaleIsoCode } from '@blog/config';
import type { TTranslationMap } from '@blog/service';
import { localeForPrefix } from '@web/i18n/routing';
import { findTranslatedPath } from '@web/utils/find-translated-path';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';

type TSwitchLanguageTargetParams = {
  translationMap: TTranslationMap;
  from: string;
  to: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
  liveLocales: readonly TLocaleIsoCode[];
};

const LIST_PAGE_BY_SEGMENT = new Map<string, string>([
  ['blog', routes.blogIndex()],
  ['topics', routes.topics()],
  ['tags', routes.tags()],
]);

const toFallbackHref = (pathname: string): string => {
  const [first = '', second] = pathname.split('/').filter(Boolean);
  const listPage = LIST_PAGE_BY_SEGMENT.get(first);

  return listPage && second !== undefined ? listPage : routes.home();
};

const splitLanguagePrefix = (
  pathname: string,
  defaultLocale: TLocaleIsoCode,
  liveLocales: readonly TLocaleIsoCode[],
): { locale: TLocaleIsoCode; pathname: string } => {
  const [, firstSegment = '', ...rest] = pathname.split('/');
  const prefixed = localeForPrefix(firstSegment);

  return prefixed &&
    prefixed !== defaultLocale &&
    liveLocales.includes(prefixed)
    ? { locale: prefixed, pathname: `/${rest.join('/')}` }
    : { locale: defaultLocale, pathname };
};

export const toSwitchLanguageTarget = ({
  translationMap,
  from,
  to,
  defaultLocale,
  liveLocales,
}: TSwitchLanguageTargetParams): string => {
  const current = splitLanguagePrefix(from, defaultLocale, liveLocales);

  return (
    findTranslatedPath({
      translationMap,
      pathname: current.pathname,
      fromLocale: current.locale,
      toLocale: to,
      defaultLocale,
    }) ??
    toLocalizedPathname({
      href: toFallbackHref(current.pathname),
      locale: to,
      defaultLocale,
    })
  );
};
