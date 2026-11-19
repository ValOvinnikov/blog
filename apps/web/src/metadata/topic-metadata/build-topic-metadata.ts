import { routes } from '@shinefold/config';
import { TOPIC_LOG } from '@web/constants/topic';
import { toPaginatedPageMetadata } from '@web/metadata/to-paginated-page-metadata';
import { getTopicPage } from '@web/server/topic/get-topic-page/get-topic-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';

export const buildTopicMetadata = async (
  slug: string,
  page = 1,
): Promise<Metadata> => {
  const result = await getTopicPage(slug);

  if (!result.ok) {
    logger.error(TOPIC_LOG.METADATA_FETCH_FAILED, {
      slug,
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
    href: routes.topic(slug, page),
    translations: translations.map(({ language, slug: translatedSlug }) => ({
      language,
      href: routes.topic(translatedSlug),
    })),
    ogType: 'website',
  });
};
