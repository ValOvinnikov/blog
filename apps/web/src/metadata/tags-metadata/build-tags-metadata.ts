import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildTagsMetadata = async (): Promise<Metadata> => {
  const result = await service.pages.tagIndex.v1.getIndexPage();

  if (!result.ok) {
    logger.error('tags_metadata.fetch_failed', { error: result.error });
    return {};
  }

  const { seo } = result.data;

  return toMetadata(seo, { canonical: routes.tags(), ogType: 'website' });
};
