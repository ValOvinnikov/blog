import { routes } from '@shinefold/config';
import { POST_INDEX_LOG } from '@web/constants/post-index';
import { toPaginatedPageMetadata } from '@web/metadata/to-paginated-page-metadata';
import { getPostIndexPage } from '@web/server/post-index/get-post-index-page/get-post-index-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildPostIndexMetadata = async (
  page: number,
): Promise<Metadata> => {
  const result = await getPostIndexPage();

  if (!result.ok) {
    logger.error(POST_INDEX_LOG.METADATA_FETCH_FAILED, {
      page,
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, translations } = result.data;

  return toPaginatedPageMetadata(seo, {
    page,
    href: routes.blogIndex(page),
    translations: translations.map((language) => ({
      language,
      href: routes.blogIndex(),
    })),
    ogType: 'website',
    feedUrl: routes.rssFeed(),
  });
};
