import { routes } from '@blog/config';
import { service, type TPostCard } from '@blog/service';
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
  posts: TPostCard[];
};

const toRssItem = (post: TPostCard, siteUrl: string): TRssItem => {
  return {
    title: post.title,
    link: `${siteUrl}${routes.post(post.slug)}`,
    description: post.excerpt,
    publishedAt: post.publishedAt,
  };
};

/**
 * Fetches every published post tagged with `slug`, newest first. First
 * resolves the tag itself (for the channel title/description and the
 * `page_tag.postList` module id), then fetches every windowed page of that
 * module — page 1 for the total, the remaining pages in parallel — and
 * concatenates, mirroring the site-wide `getAllPublishedPosts` in
 * `app/rss.xml/route.ts`. Returns `null` when the tag itself or its first
 * page of posts can't be loaded — a broken tag lookup 404s instead of
 * silently falling back to a generic channel (unlike the site-wide feed,
 * there is no meaningful generic fallback for "posts tagged X").
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

  const { tag, postListId } = tagResult.data;

  const firstPageResult = await service.modules.postList.v1.getPostList(
    postListId,
    1,
  );
  if (!firstPageResult.ok) {
    logger.error('tag_rss.first_page_fetch_failed', {
      slug,
      error: firstPageResult.error,
    });
    return null;
  }

  const { posts, totalPages } = firstPageResult.data;
  const description = tag.description ?? tag.title;

  if (totalPages <= 1) {
    return { title: tag.title, description, posts };
  }

  const restPageNumbers = Array.from(
    { length: totalPages - 1 },
    (_, i) => i + 2,
  );
  const restResults = await Promise.all(
    restPageNumbers.map((page) =>
      service.modules.postList.v1.getPostList(postListId, page),
    ),
  );

  const restPosts = restResults.flatMap((page) => {
    if (!page.ok) {
      logger.error('tag_rss.page_fetch_failed', { slug, error: page.error });
      return [];
    }
    return page.data.posts;
  });

  return { title: tag.title, description, posts: [...posts, ...restPosts] };
};

/**
 * RSS 2.0 feed of every published post tagged with the `[slug]` tag, newest
 * posts first (the order the post-list module's windowed pages already
 * return them in). Mirrors the site-wide `rss.xml` route, scoped to a
 * single tag — the channel title/description come from the tag itself
 * rather than site settings, so a broken tag or post-list lookup 404s
 * instead of silently falling back to a generic channel.
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
