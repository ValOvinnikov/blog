import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

/**
 * Metadata for the `/topics` hub, sourced from `page_topicIndex`'s resolved
 * `seo` — mirrors `buildBlogListMetadata`. Reuses `getIndexPage` (also
 * called by `TopicsPage`), so this adds no extra round-trip.
 */
export const buildTopicsMetadata = async (
  tenant: string,
): Promise<Metadata> => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.pages.topicIndex.v1.getIndexPage(tenantContext);

  if (!result.ok) {
    logger.error('topics_metadata.fetch_failed', { error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo } = result.data;

  return toMetadata(seo, { canonical: routes.topics(), ogType: 'website' });
};
