import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

/**
 * Metadata for a `/[slug]` standalone page (`page_landing`). Unlike
 * `TTopic`, `TLandingPage.seo` is already a fully-resolved `TSeoResolved`
 * (authored → content → site defaults), so this maps it straight through
 * `toMetadata` rather than building fallback fields itself.
 *
 * Reuses `getPage` (also called by `LandingPage`) — Next dedupes the fetch
 * per request, so this adds no extra round-trip.
 */
export const buildLandingPageMetadata = async (
  slug: string,
  tenant: string,
): Promise<Metadata> => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.pages.landing.v1.getPage(slug, tenantContext);

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
