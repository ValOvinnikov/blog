import {
  routes,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';
import { service, type TTranslationMap } from '@blog/service';
import { hasLength, isUndefined } from '@blog/utils/primitives';
import { findListPage } from '@web/utils/find-list-page';
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

const POST_SEGMENT = 'blog';

const DOCUMENT_PAGES = new Map<string, Omit<TTranslatablePage, 'slug'>>([
  [POST_SEGMENT, { documentType: 'page_post', toHref: routes.post }],
  [
    'privacy',
    { documentType: 'page_privacyDocument', toHref: routes.privacyDocument },
  ],
  [
    'legal',
    { documentType: 'page_legalDocument', toHref: routes.legalDocument },
  ],
]);

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
  const documentPage = DOCUMENT_PAGES.get(first);
  const archivePage = ARCHIVE_PAGES.get(first);
  const isArchivePath =
    !isUndefined(second) &&
    (!hasLength(rest) || (rest.length === 2 && rest[0] === 'page'));

  if (documentPage && !isUndefined(second) && !hasLength(rest)) {
    const slug = decodeSegment(second);
    return slug ? { ...documentPage, slug } : undefined;
  }

  if (archivePage && isArchivePath) {
    const slug = decodeSegment(second);
    return slug ? { ...archivePage, slug } : undefined;
  }

  const decoded = segments.map(decodeSegment);
  if (!hasLength(decoded) || !decoded.every(Boolean)) {
    return undefined;
  }

  return {
    documentType: 'page_landing',
    slug: decoded.join('/'),
    toHref: routes.landingPage,
  };
};

const toListPage = (pathname: string, translationMap: TTranslationMap) => {
  if (pathname === routes.home()) {
    return { href: routes.home(), languages: translationMap.homeLanguages };
  }

  if (pathname === routes.cookieStatement()) {
    return {
      href: routes.cookieStatement(),
      languages: translationMap.cookieStatementLanguages,
    };
  }

  const [first = '', ...rest] = pathname.split('/').filter(Boolean);
  const isNumberedPostIndexPage =
    first === POST_SEGMENT && rest.length === 2 && rest[0] === 'page';

  return !hasLength(rest) || isNumberedPostIndexPage
    ? findListPage(first, translationMap)
    : undefined;
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

  const listPage = toListPage(pathname, translationMap);
  if (listPage) {
    return listPage.languages.includes(toLocale)
      ? toLocalizedPathname({
          href: listPage.href,
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
