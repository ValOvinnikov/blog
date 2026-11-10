import { LOCALE_BCP47_TAGS } from '@blog/config';
import { routing } from '@web/i18n/routing';
import type { MetadataRoute } from 'next';

export const toSitemapEntry = (
  path: string,
  siteUrl: string,
): MetadataRoute.Sitemap[number] => {
  return {
    url: `${siteUrl}${path}`,
    alternates: {
      languages: Object.fromEntries(
        [routing.defaultLocale].map((locale) => [
          LOCALE_BCP47_TAGS[locale],
          `${siteUrl}${path}`,
        ]),
      ),
    },
  };
};
