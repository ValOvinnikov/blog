import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getLandingPage } from '@web/server/landing/get-landing-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

/**
 * Metadata for a `/[slug]` standalone page (`page_landing`). Unlike
 * `TTopic`, `TLandingPage.seo` is already a fully-resolved `TSeoResolved`
 * (authored → content → site defaults), so this maps it straight through
 * `toMetadata` rather than building fallback fields itself.
 *
 * Reads the same cached `getLandingPage` loader the route's own
 * `LandingPage` composition reads, so building metadata costs no second
 * Sanity fetch.
 */
export const buildLandingPageMetadata = async (
  slug: string,
  tenant: string,
): Promise<Metadata> => {
  const result = await getLandingPage(slug, tenant);

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
