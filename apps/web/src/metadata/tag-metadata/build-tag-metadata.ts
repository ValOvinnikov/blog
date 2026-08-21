import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { logger } from '@web/utils/logger/logger';
import { TAG_ITEMS_PER_PAGE } from '@web/utils/tag-items-per-page';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Metadata for a `/tag/[slug]` page (page 1, `pageNumber` omitted) or a
 * `/tag/[slug]/page/[page]` page (`pageNumber` ≥ 2). Unlike `TTopic`,
 * `TTagPageTag.seo` is already a fully-resolved `TSeoResolved` (authored →
 * content → site defaults), so this maps it straight through `toMetadata`,
 * only overlaying the "– Page N" suffix on `title`/`ogTitle` for page ≥ 2 —
 * matching `buildTopicMetadata`'s pagination behaviour. Every page
 * self-canonicalizes — page 2+ must never canonical to `/tag/[slug]`.
 *
 * Reuses `getTagPage` (also called by `TagPage`) — Next dedupes the fetch
 * per request, so this adds no extra round-trip.
 *
 * Every page also advertises the tag's own RSS feed
 * (`/tag/[slug]/rss.xml`) via `alternates.types['application/rss+xml']` —
 * the same feed regardless of which page of the tag's post list is showing.
 */
export const buildTagMetadata = async (
  slug: string,
  pageNumber?: number,
): Promise<Metadata> => {
  const [result, t] = await Promise.all([
    service.pages.tag.v1.getTagPage(slug, {
      page: pageNumber,
      itemsPerPage: TAG_ITEMS_PER_PAGE,
    }),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    logger.error('tag_metadata.fetch_failed', { slug, error: result.error });
    return {};
  }
  if (result.data === null) {
    return {};
  }

  const { seo } = result.data.tag;
  const title =
    pageNumber === undefined
      ? seo.title
      : `${seo.title} ${t('pageSuffix', { page: pageNumber })}`;
  const ogTitle =
    pageNumber === undefined
      ? seo.ogTitle
      : `${seo.ogTitle} ${t('pageSuffix', { page: pageNumber })}`;

  return toMetadata(
    { ...seo, title, ogTitle },
    {
      canonical: routes.tag(slug, pageNumber),
      ogType: 'website',
      feedUrl: routes.tagRssFeed(slug),
    },
  );
};
