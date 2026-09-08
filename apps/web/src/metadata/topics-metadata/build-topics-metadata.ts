import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTopicsIndexPage } from '@web/server/topics-index/get-topics-index-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

/**
 * Metadata for the `/topics` hub, sourced from `page_topicIndex`'s resolved
 * `seo` — mirrors `buildBlogListMetadata`. Reuses `getTopicsIndexPage` (also
 * called by `TopicsPage`), so this adds no extra round-trip.
 */
export const buildTopicsMetadata = async (
  tenant: string,
): Promise<Metadata> => {
  const result = await getTopicsIndexPage(tenant);

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
