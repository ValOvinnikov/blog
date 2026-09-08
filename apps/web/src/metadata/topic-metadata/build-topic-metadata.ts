import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTopicPage } from '@web/server/topic/get-topic-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Metadata for a `/topics/[slug]` page (page 1, `pageNumber` omitted) or a
 * `/topics/[slug]/page/[page]` page (`pageNumber` ≥ 2), built from the
 * `page_topic` document's own resolved `seo` (falling back through the
 * topic's title/description, then site settings — see
 * `toTopicDetailPage`). Every page self-canonicalizes — page 2+ must never
 * canonical to `/topics/[slug]`.
 *
 * Reads the same cached `getTopicPage` loader the route's own `TopicPage`
 * composition reads, so building metadata costs no second Sanity fetch.
 */
export const buildTopicMetadata = async (
  slug: string,
  tenant: string,
  pageNumber?: number,
): Promise<Metadata> => {
  const [result, t] = await Promise.all([
    getTopicPage(slug, tenant),
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
          ogTitle: `${seo.ogTitle} ${t('pageSuffix', { page: pageNumber })}`,
        };

  return toMetadata(resolvedSeo, {
    canonical: routes.topic(slug, pageNumber),
    ogType: 'website',
  });
};
