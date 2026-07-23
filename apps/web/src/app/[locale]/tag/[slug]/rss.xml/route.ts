import { routes } from '@blog/config';
import { service, type TPostCard } from '@blog/service';
import { buildRssFeed, type TRssItem } from '@web/utils/build-rss-feed';
import { env } from '@web/utils/env/env';
import { notFound } from 'next/navigation';

type TProps = {
  params: Promise<{ slug: string }>;
};

function toRssItem(post: TPostCard, siteUrl: string): TRssItem {
  return {
    title: post.title,
    link: `${siteUrl}${routes.post(post.slug)}`,
    description: post.excerpt,
    publishedAt: post.publishedAt,
  };
}

/**
 * RSS 2.0 feed of every published post tagged with the `[slug]` tag, newest
 * posts first (the order `getTagPage`'s unpaginated call already returns
 * them in). Mirrors the site-wide `rss.xml` route, scoped to a single tag —
 * the channel title/description come from the tag itself rather than site
 * settings, so a broken tag lookup 404s instead of silently falling back to
 * a generic channel (unlike the site-wide feed, there is no meaningful
 * generic fallback for "posts tagged X").
 */
export async function GET(
  _request: Request,
  { params }: TProps,
): Promise<Response> {
  const { slug } = await params;
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';

  const result = await service.pages.tag.v1.getTagPage(slug);

  if (!result) {
    notFound();
  }

  const xml = buildRssFeed(
    {
      title: result.tag.title,
      description: result.tag.description ?? result.tag.title,
      siteUrl,
    },
    result.posts.map((post) => toRssItem(post, siteUrl)),
  );

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
