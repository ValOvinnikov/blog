import { routes } from '@blog/config';
import { toLocalizedPageMetadata } from '@web/metadata/to-localized-page-metadata';
import { getTagIndexPage } from '@web/server/tag-index/get-tag-index-page/get-tag-index-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildTagIndexMetadata = async (): Promise<Metadata> => {
  const result = await getTagIndexPage();

  if (!result.ok) {
    logger.error('tag_index_metadata.fetch_failed', { error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;

  return toLocalizedPageMetadata(seo, {
    href: routes.tags(),
    translations,
    ogType: 'website',
  });
};
