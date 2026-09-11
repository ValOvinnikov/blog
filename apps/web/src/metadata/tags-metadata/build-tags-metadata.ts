import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTagsIndexPage } from '@web/server/tags-index/get-tags-index-page';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

/**
 * Metadata for the `/tags` hub, sourced from `page_tagIndex`'s resolved
 * `seo`. Reuses `getTagsIndexPage` (also called by `TagsPage`), so this
 * adds no extra round-trip.
 */
export const buildTagsMetadata = async (tenant: string): Promise<Metadata> => {
  const [result, tenantContext] = await Promise.all([
    getTagsIndexPage(tenant),
    getTenantSanityContext(tenant),
  ]);

  if (!result.ok) {
    logger.error('tags_metadata.fetch_failed', { error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo } = result.data;

  return toMetadata(seo, tenantContext, {
    canonical: routes.tags(),
    ogType: 'website',
  });
};
