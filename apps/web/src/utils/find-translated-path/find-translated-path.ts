import {
  routes,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';
import { service, type TTranslationMap } from '@blog/service';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';

type TFindTranslatedPathParams = {
  translationMap: TTranslationMap;
  pathname: string;
  fromLocale: TLocaleIsoCode;
  toLocale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
};

const toLandingSlug = (pathname: string): TMaybeUndefined<string> => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 1) {
    return undefined;
  }
  try {
    return decodeURIComponent(segments[0]!);
  } catch {
    return undefined;
  }
};

/** `pathname` carries no language prefix; the result does, for `toLocale`. */
export const findTranslatedPath = ({
  translationMap,
  pathname,
  fromLocale,
  toLocale,
  defaultLocale,
}: TFindTranslatedPathParams): TMaybeUndefined<string> => {
  if (fromLocale === toLocale) {
    return toLocalizedPathname({
      href: pathname,
      locale: toLocale,
      defaultLocale,
    });
  }

  if (pathname === routes.home()) {
    return translationMap.homeLanguages.includes(toLocale)
      ? toLocalizedPathname({
          href: routes.home(),
          locale: toLocale,
          defaultLocale,
        })
      : undefined;
  }

  const slug = toLandingSlug(pathname);
  if (!slug) {
    return undefined;
  }

  const translation = service.global.translationMap.v1
    .findTranslationGroup(translationMap, {
      documentType: 'page_landing',
      language: fromLocale,
      slug,
    })
    ?.find(({ language }) => language === toLocale);

  return (
    translation &&
    toLocalizedPathname({
      href: routes.landingPage(translation.slug),
      locale: toLocale,
      defaultLocale,
    })
  );
};
