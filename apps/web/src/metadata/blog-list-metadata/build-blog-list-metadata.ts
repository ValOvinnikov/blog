import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Metadata for a blog list page. Every page self-canonicalizes — page 2+
 * must NEVER canonical to /blog (spec do-not-change rule). Every page also
 * advertises the site-wide RSS feed (`/rss.xml`) via
 * `alternates.types['application/rss+xml']` — the blog list is the page
 * whose content (every published post) matches the feed's content, and it's
 * the same feed regardless of which page of the list is showing.
 *
 * Reuses `getIndexPage` (also called by `BlogListPage`) — Next dedupes the
 * fetch per request, so this adds no extra round-trip.
 */
export const buildBlogListMetadata = async (
  page: number,
): Promise<Metadata> => {
  const [result, t] = await Promise.all([
    service.pages.blog.v1.getIndexPage(),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    logger.error('blog_list_metadata.fetch_failed', {
      page,
      error: result.error,
    });
    return {};
  }

  const { seo } = result.data;
  const resolvedSeo =
    page === 1
      ? seo
      : {
          ...seo,
          title: `${seo.title} ${t('pageSuffix', { page })}`,
          ogTitle: `${seo.ogTitle} ${t('pageSuffix', { page })}`,
        };

  return toMetadata(resolvedSeo, {
    canonical: routes.blogIndex(page),
    ogType: 'website',
    feedUrl: routes.rssFeed(),
  });
};
