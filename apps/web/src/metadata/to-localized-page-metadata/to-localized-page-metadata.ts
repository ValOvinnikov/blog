import { LOCALE_BCP47_TAGS } from '@blog/config';
import type { TSeoResolved } from '@blog/service';
import { routing } from '@web/i18n/routing';
import { toMetadata, type TToMetadataOptions } from '@web/metadata/to-metadata';
import { getRequestContext } from '@web/server/request-context/request-context';
import type { TLanguagePage } from '@web/utils/to-language-alternates';
import { toLiveLanguagePages } from '@web/utils/to-live-language-pages';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import { withLanguageAlternates } from '@web/utils/with-language-alternates';
import type { Metadata } from 'next';

type TToLocalizedPageMetadataOptions = Omit<TToMetadataOptions, 'canonical'> & {
  href: string;
  translations: readonly TLanguagePage[];
};

export const toLocalizedPageMetadata = async (
  seo: TSeoResolved,
  { href, translations, feedUrl, ...options }: TToLocalizedPageMetadataOptions,
): Promise<Metadata> => {
  const {
    locale,
    defaultLocale = routing.defaultLocale,
    liveLocales = [locale],
  } = await getRequestContext();
  const canonical = toLocalizedPathname({ href, locale, defaultLocale });
  const metadata = await toMetadata(seo, {
    ...options,
    canonical,
    feedUrl:
      feedUrl && toLocalizedPathname({ href: feedUrl, locale, defaultLocale }),
  });
  const alternateLocales = toLiveLanguagePages({
    pages: translations,
    liveLocales,
  })
    .filter(({ language }) => language !== locale)
    .map(({ language }) => LOCALE_BCP47_TAGS[language]);

  return withLanguageAlternates(
    {
      ...metadata,
      openGraph: {
        ...metadata.openGraph,
        locale: LOCALE_BCP47_TAGS[locale],
        url: canonical,
        ...(alternateLocales.length > 0 && {
          alternateLocale: alternateLocales,
        }),
      },
    },
    { pages: translations, locale, liveLocales, defaultLocale },
  );
};
