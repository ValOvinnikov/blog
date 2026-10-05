import type { TLocaleIsoCode } from '@blog/config';
import {
  toLanguageAlternates,
  type TLanguagePage,
} from '@web/utils/to-language-alternates';
import type { Metadata } from 'next';

type TWithLanguageAlternatesParams = {
  pages: readonly TLanguagePage[];
  locale: TLocaleIsoCode;
  liveLocales: readonly TLocaleIsoCode[];
  defaultLocale: TLocaleIsoCode;
};

export const withLanguageAlternates = (
  metadata: Metadata,
  { pages, locale, liveLocales, defaultLocale }: TWithLanguageAlternatesParams,
): Metadata => {
  const livePages = pages.filter(({ language }) =>
    liveLocales.includes(language),
  );

  if (livePages.every(({ language }) => language === locale)) {
    return metadata;
  }

  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      languages: toLanguageAlternates({ pages: livePages, defaultLocale }),
    },
  };
};
