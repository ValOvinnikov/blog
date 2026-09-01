import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

/**
 * Metadata for a `/[slug]` standalone page (`page_generic`). Unlike
 * `TTopic`, `TGenericPage.seo` is already a fully-resolved `TSeoResolved`
 * (authored → content → site defaults), so this maps it straight through
 * `toMetadata` rather than building fallback fields itself.
 *
 * Reuses `getPage` (also called by `GenericPage`) — Next dedupes the fetch
 * per request, so this adds no extra round-trip.
 */
export const buildGenericPageMetadata = async (
  slug: string,
): Promise<Metadata> => {
  const tenant = await getTenantSanityContext();
  const result = await service.pages.generic.v1.getPage(slug, tenant);

  if (!result.ok) {
    logger.error('generic_page_metadata.fetch_failed', {
      slug,
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  return toMetadata(result.data.seo, {
    canonical: routes.genericPage(slug),
    ogType: 'website',
  });
};
