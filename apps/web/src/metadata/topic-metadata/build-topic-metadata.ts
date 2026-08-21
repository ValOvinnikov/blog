import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { logger } from '@web/utils/logger/logger';
import { TOPIC_ITEMS_PER_PAGE } from '@web/utils/topic-items-per-page';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Metadata for a `/topics/[slug]` page (page 1, `pageNumber` omitted) or a
 * `/topics/[slug]/page/[page]` page (`pageNumber` ≥ 2). `TTopic` carries
 * no dedicated `seo`/OG fields (unlike `TPostDetail.seo`), so this builds
 * `Metadata` directly from the topic's own `title`/`description` rather
 * than inventing fields the service layer doesn't provide. Every page
 * self-canonicalizes — page 2+ must never canonical to `/topics/[slug]`.
 *
 * Reuses `getTopicPage` (also called by `TopicPage`) — Next dedupes
 * the fetch per request, so this adds no extra round-trip.
 */
export const buildTopicMetadata = async (
  slug: string,
  pageNumber?: number,
): Promise<Metadata> => {
  const [result, t] = await Promise.all([
    service.pages.topic.v1.getTopicPage(slug, {
      page: pageNumber,
      itemsPerPage: TOPIC_ITEMS_PER_PAGE,
    }),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    logger.error('topic_metadata.fetch_failed', {
      slug,
      error: result.error,
    });
    return {};
  }
  if (result.data === null) {
    return {};
  }

  const { topic } = result.data;
  const description = topic.description ?? topic.title;
  const title =
    pageNumber === undefined
      ? topic.title
      : `${topic.title} ${t('pageSuffix', { page: pageNumber })}`;

  return toMetadata(
    {
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImageUrl: undefined,
    },
    {
      canonical: routes.topic(slug, pageNumber),
      ogType: 'website',
    },
  );
};
