import { routes } from '@blog/config';
import { service, type TArchivePostCard } from '@blog/service';
import { buildRssFeed, type TRssItem } from '@web/utils/build-rss-feed';
import { env } from '@web/utils/env/env';

const FALLBACK_TITLE = 'Blog';
const FALLBACK_DESCRIPTION = 'Latest posts';

function toRssItem(post: TArchivePostCard, siteUrl: string): TRssItem {
  return {
    title: post.title,
    link: `${siteUrl}${routes.post(post.slug)}`,
    description: post.excerpt,
    publishedAt: post.publishedAt,
  };
}

async function getAllPublishedPosts(): Promise<TArchivePostCard[]> {
  const firstPageResult = await service.pages.blog.v1.getIndexPage({ page: 1 });
  if (!firstPageResult.ok) {
    console.error(
      `Error fetching blog index page for RSS feed: ${firstPageResult.error}`,
    );
    return [];
  }

  const { posts, totalPages } = firstPageResult.data;
  if (totalPages <= 1) return posts;

  const restPageNumbers = Array.from(
    { length: totalPages - 1 },
    (_, i) => i + 2,
  );
  const restResults = await Promise.all(
    restPageNumbers.map((page) => service.pages.blog.v1.getIndexPage({ page })),
  );

  const restPosts = restResults.flatMap((result) => {
    if (!result.ok) {
      console.error(`Error fetching blog page for RSS feed: ${result.error}`);
      return [];
    }
    return result.data.posts;
  });

  return [...posts, ...restPosts];
}

/**
 * RSS 2.0 feed of every published post, newest posts first (the order the
 * blog index already returns them in). Falls back to a generic channel
 * title/description when site settings fail to load — a broken feed must
 * never break because of an unrelated global-content fetch failure.
 */
export async function GET(): Promise<Response> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';

  const [posts, siteSettingsResult] = await Promise.all([
    getAllPublishedPosts(),
    service.global.siteSettings.v1.getSiteSettings(),
  ]);

  const title = siteSettingsResult.ok
    ? siteSettingsResult.data.brand.name
    : FALLBACK_TITLE;
  const description = siteSettingsResult.ok
    ? siteSettingsResult.data.description
    : FALLBACK_DESCRIPTION;
  if (!siteSettingsResult.ok) {
    console.error(
      `Error fetching site settings for RSS feed: ${siteSettingsResult.error}`,
    );
  }

  const xml = buildRssFeed(
    { title, description, siteUrl },
    posts.map((post) => toRssItem(post, siteUrl)),
  );

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
