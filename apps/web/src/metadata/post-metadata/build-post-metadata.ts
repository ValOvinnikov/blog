import { routes } from '@shinefold/config';
import { OG_TYPE } from '@web/constants/metadata';
import { POST_LOG } from '@web/constants/post';
import { toLocalizedPageMetadata } from '@web/metadata/to-localized-page-metadata';
import { getPostPage } from '@web/server/post/get-post-page/get-post-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildPostMetadata = async (slug: string): Promise<Metadata> => {
  const result = await getPostPage(slug);

  if (!result.ok) {
    logger.error(POST_LOG.METADATA_FETCH_FAILED, { slug, error: result.error });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo, publishedAt, author, translations } = result.data;

  return toLocalizedPageMetadata(seo, {
    href: routes.post(slug),
    translations: translations.map(({ language, slug: translatedSlug }) => ({
      language,
      href: routes.post(translatedSlug),
    })),
    ogType: OG_TYPE.ARTICLE,
    article: {
      publishedTime: publishedAt,
      authors: [author.name],
    },
  });
};
