import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getPostPage } from '@web/server/post/get-post-page/get-post-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildPostMetadata = async (slug: string): Promise<Metadata> => {
  const result = await getPostPage(slug);

  if (!result.ok) {
    logger.error('post_metadata.fetch_failed', { slug, error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, publishedAt, author } = result.data;

  return toMetadata(seo, {
    canonical: routes.post(slug),
    ogType: 'article',
    article: {
      publishedTime: publishedAt,
      authors: [author.name],
    },
  });
};
