import { routes } from '@blog/config';
import { service, type TPostCard } from '@blog/service';
import { buildRssFeed, type TRssItem } from '@web/utils/build-rss-feed';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { getTranslations } from 'next-intl/server';

const toRssItem = (post: TPostCard, siteUrl: string): TRssItem => {
  return {
    title: post.title,
    link: `${siteUrl}${routes.post(post.slug)}`,
    description: post.excerpt,
    publishedAt: post.publishedAt,
  };
};

const getAllPublishedPosts = async (): Promise<TPostCard[]> => {
  const indexPageResult = await service.pages.blog.v1.getIndexPage();
  if (!indexPageResult.ok) {
    logger.error('rss.index_page_fetch_failed', {
      error: indexPageResult.error,
    });
    return [];
  }

  const { postListId } = indexPageResult.data;

  const firstPageResult = await service.modules.postList.v1.getPostList(
    postListId,
    1,
  );
  if (!firstPageResult.ok) {
    logger.error('rss.first_page_fetch_failed', {
      error: firstPageResult.error,
    });
    return [];
  }

  const { posts, totalPages } = firstPageResult.data;
  if (totalPages <= 1) return posts;

  const restPageNumbers = Array.from(
    { length: totalPages - 1 },
    (_, i) => i + 2,
  );
  const restResults = await Promise.all(
    restPageNumbers.map((page) =>
      service.modules.postList.v1.getPostList(postListId, page),
    ),
  );

  const restPosts = restResults.flatMap((result) => {
    if (!result.ok) {
      logger.error('rss.page_fetch_failed', { error: result.error });
      return [];
    }
    return result.data.posts;
  });

  return [...posts, ...restPosts];
};

/**
 * RSS 2.0 feed of every published post, newest posts first (the order the
 * blog archive already returns them in). Falls back to a generic channel
 * title/description when site settings fail to load — a broken feed must
 * never break because of an unrelated global-content fetch failure.
 */
export async function GET(): Promise<Response> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';

  const [posts, siteSettingsResult, t] = await Promise.all([
    getAllPublishedPosts(),
    service.global.siteSettings.v1.getSiteSettings(),
    getTranslations('rss'),
  ]);

  const title = siteSettingsResult.ok
    ? siteSettingsResult.data.brand.name
    : t('fallbackTitle');
  const description = siteSettingsResult.ok
    ? siteSettingsResult.data.description
    : t('fallbackDescription');
  if (!siteSettingsResult.ok) {
    logger.error('rss.site_settings_fetch_failed', {
      error: siteSettingsResult.error,
    });
  }

  const xml = buildRssFeed(
    { title, description, siteUrl },
    posts.map((post) => toRssItem(post, siteUrl)),
  );

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
