import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config';
import { service, type TTranslationMap } from '@blog/service';
import { toLanguageAlternates } from '@web/utils/to-language-alternates';
import { toLiveLanguagePages } from '@web/utils/to-live-language-pages';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import type { MetadataRoute } from 'next';

export type TTranslatedPage = { slug: string; language: TLocaleIsoCode };

export type TTranslatedSitemapContext = {
  translationMap: TTranslationMap;
  liveLocales: readonly TLocaleIsoCode[];
  defaultLocale: TLocaleIsoCode;
  siteUrl: string;
};

type TTranslatedSitemapEntryParams = TTranslatedSitemapContext & {
  page: TTranslatedPage;
  documentType: string;
  toHref: (slug: string) => string;
  lastModified?: string;
};

export const toAbsoluteAlternates = (
  alternates: Record<string, string>,
  siteUrl: string,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(alternates).map(([language, path]) => [
      language,
      `${siteUrl}${path}`,
    ]),
  );

export const toLocalizedSitemapUrl = (
  href: string,
  language: TLocaleIsoCode,
  defaultLocale: TLocaleIsoCode,
  siteUrl: string,
) =>
  `${siteUrl}${toLocalizedPathname({ href, locale: language, defaultLocale })}`;

export const toTranslatedSitemapEntry = ({
  page,
  documentType,
  toHref,
  lastModified,
  translationMap,
  liveLocales,
  defaultLocale,
  siteUrl,
}: TTranslatedSitemapEntryParams): MetadataRoute.Sitemap[number] => {
  const url = toLocalizedSitemapUrl(
    toHref(page.slug),
    page.language,
    defaultLocale,
    siteUrl,
  );
  const liveTranslations = toLiveLanguagePages({
    pages:
      service.global.translationMap.v1.findTranslationGroup(translationMap, {
        documentType,
        slug: page.slug,
        language: page.language,
      }) ?? [],
    liveLocales,
  });

  if (liveTranslations.length < 2) {
    return {
      url,
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages: { [LOCALE_BCP47_TAGS[page.language]]: url } },
    };
  }

  return {
    url,
    ...(lastModified ? { lastModified } : {}),
    alternates: {
      languages: toAbsoluteAlternates(
        toLanguageAlternates({
          pages: liveTranslations.map(({ language, slug }) => ({
            language,
            href: toHref(slug),
          })),
          defaultLocale,
        }),
        siteUrl,
      ),
    },
  };
};
