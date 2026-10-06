import type { ITenantLocalizedParams } from '@blog/config';
import {
  service,
  type TFeedPost,
  type TTenantSanityContext,
} from '@blog/service';
import { getFeedContext } from '@web/server/feed/get-feed-context/get-feed-context';
import { buildRssFeed } from '@web/utils/build-rss-feed';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import { NextResponse } from 'next/server';

type TProps = {
  params: Promise<
    Omit<ITenantLocalizedParams, 'locale'> & { locale: string; slug: string }
  >;
};

type TTagFeed = {
  title: string;
  description: string;
  posts: TFeedPost[];
};

const getAllTagPosts = async (
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TTagFeed | null> => {
  const tagResult = await service.pages.tag.v1.getTagPage(slug, tenant);
  if (!tagResult.ok) {
    logger.error('tag_rss.tag_fetch_failed', {
      slug,
      error: tagResult.error,
    });
    return null;
  }

  if (!tagResult.data) {
    return null;
  }

  const { tag } = tagResult.data;
  const description = tag.description ?? tag.title;

  const postsResult = await service.entities.posts.v1.getPublishedPostsByTag(
    tag.id,
    tenant,
  );
  if (!postsResult.ok) {
    logger.error('tag_rss.posts_fetch_failed', {
      slug,
      error: postsResult.error,
    });
    return null;
  }

  return { title: tag.title, description, posts: postsResult.data };
};

/** Unlike the site-wide feed, a broken tag or post fetch 404s rather than serving a generic channel. */
export async function GET(
  _request: Request,
  { params }: TProps,
): Promise<Response> {
  const { slug, locale } = await params;
  const feed = await getFeedContext(locale);
  if (!feed) {
    return new NextResponse(null, { status: 404 });
  }
  const { tenant, siteUrl, toRssItem } = feed;

  const result = await getAllTagPosts(slug, tenant);

  if (!result) {
    notFound();
  }

  const xml = buildRssFeed(
    { title: result.title, description: result.description, siteUrl },
    result.posts.map(toRssItem),
  );

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
