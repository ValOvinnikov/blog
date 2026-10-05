import { routes } from '@blog/config';
import { routing } from '@web/i18n/routing';
import { toMetadata } from '@web/metadata/to-metadata';
import { getHomePage } from '@web/server/home/get-home-page/get-home-page';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import { withLanguageAlternates } from '@web/utils/with-language-alternates';
import type { Metadata } from 'next';

export const buildHomePageMetadata = async (): Promise<Metadata> => {
  const result = await getHomePage();

  if (!result.ok) {
    logger.error('home_page.metadata_fetch_failed', { error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;
  const {
    locale,
    defaultLocale = routing.defaultLocale,
    liveLocales = [locale],
  } = await getRequestContext();
  const metadata = await toMetadata(seo, {
    canonical: toLocalizedPathname({
      href: routes.home(),
      locale,
      defaultLocale,
    }),
    ogType: 'website',
    titleAbsolute: true,
  });

  return withLanguageAlternates(metadata, {
    pages: translations.map((language) => ({ language, href: routes.home() })),
    locale,
    liveLocales,
    defaultLocale,
  });
};
