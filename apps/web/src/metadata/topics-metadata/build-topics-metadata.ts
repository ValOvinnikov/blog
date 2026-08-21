import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

/**
 * Metadata for the `/topics` hub, sourced from `page_topicIndex`'s resolved
 * `seo` — mirrors `buildBlogListMetadata`. Reuses `getIndexPage` (also
 * called by `TopicsPage`), so this adds no extra round-trip.
 */
export const buildTopicsMetadata = async (): Promise<Metadata> => {
  const result = await service.pages.topicIndex.v1.getIndexPage();

  if (!result.ok) {
    logger.error('topics_metadata.fetch_failed', { error: result.error });
    return {};
  }

  const { seo } = result.data;

  return toMetadata(seo, { canonical: routes.topics(), ogType: 'website' });
};
