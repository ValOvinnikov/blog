import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getLandingPage } from '@web/server/landing/get-landing-page';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

/**
 * Metadata for a `/[slug]` standalone page (`page_landing`), mapping its
 * authored `seo` straight through `toMetadata`.
 *
 * Reads the same cached `getLandingPage` loader the route's own
 * `LandingPage` composition reads, so building metadata costs no second
 * Sanity fetch.
 */
export const buildLandingPageMetadata = async (
  slug: string,
  tenant: string,
): Promise<Metadata> => {
  const [result, tenantContext] = await Promise.all([
    getLandingPage(slug, tenant),
    getTenantSanityContext(tenant),
  ]);

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

  return toMetadata(result.data.seo, tenantContext, {
    canonical: routes.landingPage(slug),
    ogType: 'website',
  });
};
