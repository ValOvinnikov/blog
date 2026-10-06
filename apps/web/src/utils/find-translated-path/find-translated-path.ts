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

type TTranslatablePage = {
  documentType: string;
  slug: string;
  toHref: (slug: string) => string;
};

const ARCHIVE_PAGES = new Map<string, Omit<TTranslatablePage, 'slug'>>([
  ['topics', { documentType: 'page_topic', toHref: routes.topic }],
  ['tags', { documentType: 'page_tag', toHref: routes.tag }],
]);

const decodeSegment = (segment: string): TMaybeUndefined<string> => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return undefined;
  }
};

/** A numbered archive page maps to the first page of its translation: each language's list need not run to the same number of pages. */
const toTranslatablePage = (
  pathname: string,
): TMaybeUndefined<TTranslatablePage> => {
  const segments = pathname.split('/').filter(Boolean);
  const [first = '', second, ...rest] = segments;
  const archivePage = ARCHIVE_PAGES.get(first);
  const isArchivePath =
    second !== undefined &&
    (rest.length === 0 || (rest.length === 2 && rest[0] === 'page'));

  if (archivePage && isArchivePath) {
    const slug = decodeSegment(second);
    return slug ? { ...archivePage, slug } : undefined;
  }

  const decoded = segments.map(decodeSegment);
  if (decoded.length === 0 || !decoded.every(Boolean)) {
    return undefined;
  }

  return {
    documentType: 'page_landing',
    slug: decoded.join('/'),
    toHref: routes.landingPage,
  };
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

  const page = toTranslatablePage(pathname);
  if (!page) {
    return undefined;
  }

  const translation = service.global.translationMap.v1
    .findTranslationGroup(translationMap, {
      documentType: page.documentType,
      language: fromLocale,
      slug: page.slug,
    })
    ?.find(({ language }) => language === toLocale);

  return (
    translation &&
    toLocalizedPathname({
      href: page.toHref(translation.slug),
      locale: toLocale,
      defaultLocale,
    })
  );
};
