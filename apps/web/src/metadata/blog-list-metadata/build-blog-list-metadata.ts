import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import { getBlogListPage } from '@web/server/blog-list/get-blog-list-page';
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
 * Reads the same cached `getBlogListPage` loader the route's own
 * `BlogListPage` composition reads, so building metadata costs no second
 * Sanity fetch.
 */
export const buildBlogListMetadata = async (
  page: number,
  tenant: string,
): Promise<Metadata> => {
  const [result, t] = await Promise.all([
    getBlogListPage(tenant),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    logger.error('blog_list_metadata.fetch_failed', {
      page,
      error: result.error,
    });
    return {};
  }

  if (!result.data) {
    return {};
  }

  const { seo } = result.data;
  const resolvedSeo =
    page === 1
      ? seo
      : {
          ...seo,
          title: `${seo.title} ${t('pageSuffix', { page })}`,
          ogTitle: seo.ogTitle
            ? `${seo.ogTitle} ${t('pageSuffix', { page })}`
            : undefined,
        };

  return toMetadata(resolvedSeo, {
    canonical: routes.blogIndex(page),
    ogType: 'website',
    feedUrl: routes.rssFeed(),
  });
};
