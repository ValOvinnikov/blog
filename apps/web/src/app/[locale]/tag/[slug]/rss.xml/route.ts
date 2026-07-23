import { routes } from '@blog/config';
import { service, type TPostCard } from '@blog/service';
import { buildRssFeed, type TRssItem } from '@web/utils/build-rss-feed';
import { env } from '@web/utils/env/env';
import { TAG_ITEMS_PER_PAGE } from '@web/utils/tag-items-per-page';
import { notFound } from 'next/navigation';

type TProps = {
  params: Promise<{ slug: string }>;
};

type TTagPageResult = NonNullable<
  Awaited<ReturnType<typeof service.pages.tag.v1.getTagPage>>
>;

function toRssItem(post: TPostCard, siteUrl: string): TRssItem {
  return {
    title: post.title,
    link: `${siteUrl}${routes.post(post.slug)}`,
    description: post.excerpt,
    publishedAt: post.publishedAt,
  };
}

/**
 * Fetches every published post tagged with `slug`, newest first —
 * `getTagPage` now always windows (page 1 defaults `itemsPerPage`), so this
 * fetches page 1 for the tag itself + pagination metadata, then fetches the
 * remaining pages in parallel and concatenates, mirroring the site-wide
 * `getAllPublishedPosts` in `app/rss.xml/route.ts`. Returns `null` when the
 * tag itself doesn't exist.
 */
async function getAllTagPosts(slug: string): Promise<TTagPageResult | null> {
  const firstPage = await service.pages.tag.v1.getTagPage(slug, {
    page: 1,
    itemsPerPage: TAG_ITEMS_PER_PAGE,
  });
  if (!firstPage) return null;

  const { totalPages } = firstPage;
  if (totalPages <= 1) return firstPage;

  const restPageNumbers = Array.from(
    { length: totalPages - 1 },
    (_, i) => i + 2,
  );
  const restPages = await Promise.all(
    restPageNumbers.map((page) =>
      service.pages.tag.v1.getTagPage(slug, {
        page,
        itemsPerPage: TAG_ITEMS_PER_PAGE,
      }),
    ),
  );

  const restPosts = restPages.flatMap((page) => page?.posts ?? []);

  return { ...firstPage, posts: [...firstPage.posts, ...restPosts] };
}

/**
 * RSS 2.0 feed of every published post tagged with the `[slug]` tag, newest
 * posts first (the order `getTagPage`'s windowed pages already return them
 * in). Mirrors the site-wide `rss.xml` route, scoped to a single tag — the
 * channel title/description come from the tag itself rather than site
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

  const result = await getAllTagPosts(slug);

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
