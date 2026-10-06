import type { ITenantLocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { getFeedContext } from '@web/server/feed/get-feed-context/get-feed-context';
import { buildRssFeed } from '@web/utils/build-rss-feed';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';

type TProps = {
  params: Promise<Omit<ITenantLocalizedParams, 'locale'> & { locale: string }>;
};

/**
 * A site-settings failure falls back to a generic channel title: the feed
 * must not break on an unrelated global-content fetch.
 */
export async function GET(
  _request: Request,
  { params }: TProps,
): Promise<Response> {
  const { locale } = await params;
  const feed = await getFeedContext(locale);
  if (!feed) {
    return new NextResponse(null, { status: 404 });
  }
  const { tenant, siteUrl, toRssItem } = feed;

  const [postsResult, siteSettingsResult, indexPageResult, t] =
    await Promise.all([
      service.entities.posts.v1.getAllPublishedPosts(tenant),
      service.global.siteSettings.v1.getSiteSettings(tenant),
      service.pages.blog.v1.getIndexPage(tenant),
      getTranslations({ locale, namespace: 'rss' }),
    ]);

  // A single unpaginated query: a failure yields the whole feed empty, not a
  // partially-populated one.
  if (!postsResult.ok) {
    logger.error('rss.posts_fetch_failed', { error: postsResult.error });
  }
  const posts = postsResult.ok ? postsResult.data : [];

  const title = siteSettingsResult.ok
    ? siteSettingsResult.data.brand.name
    : t('fallbackTitle');
  if (!siteSettingsResult.ok) {
    logger.error('rss.site_settings_fetch_failed', {
      error: siteSettingsResult.error,
    });
  }

  if (!indexPageResult.ok) {
    logger.error('rss.index_page_fetch_failed', {
      error: indexPageResult.error,
    });
  }
  const description = indexPageResult.ok
    ? indexPageResult.data?.seo.description
    : undefined;

  const xml = buildRssFeed(
    { title, description, siteUrl },
    posts.map(toRssItem),
  );

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
