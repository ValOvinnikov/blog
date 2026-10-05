import { routes } from '@blog/config';
import { routing } from '@web/i18n/routing';
import { toMetadata } from '@web/metadata/to-metadata';
import { getLandingPage } from '@web/server/landing/get-landing-page/get-landing-page';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import { withLanguageAlternates } from '@web/utils/with-language-alternates';
import type { Metadata } from 'next';

export const buildLandingPageMetadata = async (
  slug: string,
): Promise<Metadata> => {
  const result = await getLandingPage(slug);

  if (!result.ok) {
    logger.error('landing_page_metadata.fetch_failed', {
      slug,
      error: result.error,
    });
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
      href: routes.landingPage(slug),
      locale,
      defaultLocale,
    }),
    ogType: 'website',
  });

  return withLanguageAlternates(metadata, {
    pages: translations.map(({ language, slug: translatedSlug }) => ({
      language,
      href: routes.landingPage(translatedSlug),
    })),
    locale,
    liveLocales,
    defaultLocale,
  });
};
