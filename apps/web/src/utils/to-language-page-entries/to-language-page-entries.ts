import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config';
import { toLanguageAlternates } from '@web/utils/to-language-alternates';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import { toAbsoluteAlternates } from '@web/utils/to-translated-sitemap-entry';
import type { MetadataRoute } from 'next';

type TLanguagePageEntriesParams = {
  href: string;
  languages: readonly TLocaleIsoCode[];
  liveLocales: readonly TLocaleIsoCode[];
  defaultLocale: TLocaleIsoCode;
  siteUrl: string;
};

export const toLanguagePageEntries = ({
  href,
  languages,
  liveLocales,
  defaultLocale,
  siteUrl,
}: TLanguagePageEntriesParams): MetadataRoute.Sitemap => {
  const liveLanguages = [
    ...(languages.includes(defaultLocale) ? [defaultLocale] : []),
    ...languages.filter(
      (language) =>
        language !== defaultLocale && liveLocales.includes(language),
    ),
  ];
  const toUrl = (language: TLocaleIsoCode) =>
    `${siteUrl}${toLocalizedPathname({ href, locale: language, defaultLocale })}`;

  if (liveLanguages.length < 2) {
    return liveLanguages.map((language) => ({
      url: toUrl(language),
      alternates: {
        languages: { [LOCALE_BCP47_TAGS[language]]: toUrl(language) },
      },
    }));
  }

  const alternates = toAbsoluteAlternates(
    toLanguageAlternates({
      pages: liveLanguages.map((language) => ({ language, href })),
      defaultLocale,
    }),
    siteUrl,
  );

  return liveLanguages.map((language) => ({
    url: toUrl(language),
    alternates: { languages: alternates },
  }));
};
