import { routes } from '@blog/config';
import { service, type TFeedPost } from '@blog/service';
import { buildRssFeed, type TRssItem } from '@web/utils/build-rss-feed';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';

type TProps = {
  params: Promise<{ slug: string }>;
};

type TTagFeed = {
  title: string;
  description: string;
  posts: TFeedPost[];
};

const toRssItem = (post: TFeedPost, siteUrl: string): TRssItem => {
  return {
    title: post.title,
    link: `${siteUrl}${routes.post(post.slug)}`,
    description: post.excerpt,
    publishedAt: post.publishedAt,
  };
};

/**
 * Resolves the tag itself (for the channel title/description) and every
 * published post, newest first. The post set is site-wide rather than
 * tag-scoped today — existing behavior, not new. Returns `null` when the tag
 * lookup or the post fetch fails, which the `GET` handler 404s.
 */
const getAllTagPosts = async (slug: string): Promise<TTagFeed | null> => {
  const tagResult = await service.pages.tag.v1.getTagPage(slug);
  if (!tagResult.ok) {
    logger.error('tag_rss.tag_fetch_failed', {
      slug,
      error: tagResult.error,
    });
    return null;
  }

  const { tag } = tagResult.data;
  const description = tag.description ?? tag.title;

  const postsResult = await service.entities.posts.v1.getAllPublishedPosts();
  if (!postsResult.ok) {
    logger.error('tag_rss.posts_fetch_failed', {
      slug,
      error: postsResult.error,
    });
    return null;
  }

  return { title: tag.title, description, posts: postsResult.data };
};

/**
 * RSS 2.0 feed of every published post, scoped by the `[slug]` tag's own
 * channel title/description. Mirrors the site-wide `rss.xml` route; a broken
 * tag or post fetch 404s instead of silently falling back to a generic
 * channel.
 */
export async function GET(
  _request: Request,
  { params }: TProps,
): Promise<Response> {
  const { slug } = await params;
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';

  const result = await getAllTagPosts(slug);

  if (!result) {
    notFound();
  }

  const xml = buildRssFeed(
    { title: result.title, description: result.description, siteUrl },
    result.posts.map((post) => toRssItem(post, siteUrl)),
  );

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
