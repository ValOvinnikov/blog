import type { TLocaleIsoCode } from '@blog/config';
import type { TSeoResolved } from '@blog/service';
import { routing } from '@web/i18n/routing';
import { toMetadata, type TToMetadataOptions } from '@web/metadata/to-metadata';
import { getRequestContext } from '@web/server/request-context/request-context';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import { withLanguageAlternates } from '@web/utils/with-language-alternates';
import type { Metadata } from 'next';

type TToLocalizedPageMetadataOptions = Omit<TToMetadataOptions, 'canonical'> & {
  href: string;
  translations: readonly TLocaleIsoCode[];
};

export const toLocalizedPageMetadata = async (
  seo: TSeoResolved,
  { href, translations, ...options }: TToLocalizedPageMetadataOptions,
): Promise<Metadata> => {
  const {
    locale,
    defaultLocale = routing.defaultLocale,
    liveLocales = [locale],
  } = await getRequestContext();
  const metadata = await toMetadata(seo, {
    ...options,
    canonical: toLocalizedPathname({ href, locale, defaultLocale }),
  });

  return withLanguageAlternates(metadata, {
    pages: translations.map((language) => ({ language, href })),
    locale,
    liveLocales,
    defaultLocale,
  });
};
