import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config';
import { toLocalizedSitemapUrl } from '@web/utils/to-translated-sitemap-entry';
import type { MetadataRoute } from 'next';

export const toPaginatedPageEntry = (
  href: string,
  language: TLocaleIsoCode,
  defaultLocale: TLocaleIsoCode,
  siteUrl: string,
): MetadataRoute.Sitemap[number] => {
  const url = toLocalizedSitemapUrl(href, language, defaultLocale, siteUrl);
  return {
    url,
    alternates: { languages: { [LOCALE_BCP47_TAGS[language]]: url } },
  };
};
