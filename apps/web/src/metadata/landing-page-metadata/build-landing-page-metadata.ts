import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getLandingPage } from '@web/server/landing/get-landing-page/get-landing-page';
import { logger } from '@web/utils/logger/logger';
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

  return toMetadata(result.data.seo, {
    canonical: routes.landingPage(slug),
    ogType: 'website',
  });
};
