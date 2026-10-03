import { routes } from '@blog/config';
import { routing } from '@web/i18n/routing';
import { toMetadata } from '@web/metadata/to-metadata';
import { getLandingPage } from '@web/server/landing/get-landing-page';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';
import { toLandingPageAlternates } from '@web/utils/to-landing-page-alternates';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
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
  const { locale, defaultLocale = routing.defaultLocale } =
    await getRequestContext();
  const metadata = await toMetadata(seo, {
    canonical: toLocalizedPathname({
      href: routes.landingPage(slug),
      locale,
      defaultLocale,
    }),
    ogType: 'website',
  });

  if (translations.length === 0) {
    return metadata;
  }

  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      languages: toLandingPageAlternates({ translations, defaultLocale }),
    },
  };
};
