import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTopicPage } from '@web/server/topic/get-topic-page/get-topic-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Every page self-canonicalizes — page 2+ must never canonical to
 * `/topics/[slug]`.
 */
export const buildTopicMetadata = async (
  slug: string,
  pageNumber?: number,
): Promise<Metadata> => {
  const [result, t] = await Promise.all([
    getTopicPage(slug),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    logger.error('topic_metadata.fetch_failed', {
      slug,
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo } = result.data;
  const resolvedSeo =
    pageNumber === undefined
      ? seo
      : {
          ...seo,
          title: `${seo.title} ${t('pageSuffix', { page: pageNumber })}`,
          ogTitle: seo.ogTitle
            ? `${seo.ogTitle} ${t('pageSuffix', { page: pageNumber })}`
            : undefined,
        };

  return toMetadata(resolvedSeo, {
    canonical: routes.topic(slug, pageNumber),
    ogType: 'website',
  });
};
