import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getTagPage } from '@web/server/tag/get-tag-page';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Metadata for a `/tags/[slug]` page (page 1, `pageNumber` omitted) or a
 * `/tags/[slug]/page/[page]` page (`pageNumber` ≥ 2), built from the
 * `page_tag` document's own resolved `seo`. Every page self-canonicalizes —
 * page 2+ must never canonical to `/tags/[slug]`.
 *
 * Reads the same cached `getTagPage` loader the route's own `TagPage`
 * composition reads, so building metadata costs no second Sanity fetch.
 *
 * Every page also advertises the tag's own RSS feed
 * (`/tags/[slug]/rss.xml`) via `alternates.types['application/rss+xml']` —
 * the same feed regardless of which page of the tag's post list is showing.
 */
export const buildTagMetadata = async (
  slug: string,
  tenant: string,
  pageNumber?: number,
): Promise<Metadata> => {
  const [result, t] = await Promise.all([
    getTagPage(slug, tenant),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    logger.error('tag_metadata.fetch_failed', { slug, error: result.error });
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
    canonical: routes.tag(slug, pageNumber),
    ogType: 'website',
    feedUrl: routes.tagRssFeed(slug),
  });
};
