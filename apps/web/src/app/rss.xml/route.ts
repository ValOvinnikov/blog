import { routes } from '@blog/config';
import { service, type TFeedPost } from '@blog/service';
import { getHostTenantSanityContext } from '@web/server/tenant/get-host-tenant-sanity-context';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { buildRssFeed, type TRssItem } from '@web/utils/build-rss-feed';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';

const toRssItem = (post: TFeedPost, siteUrl: string): TRssItem => {
  return {
    title: post.title,
    link: `${siteUrl}${routes.post(post.slug)}`,
    description: post.excerpt,
    publishedAt: post.publishedAt,
  };
};

/**
 * RSS 2.0 feed of every published post, newest posts first. Falls back to a
 * generic channel title/description when site settings fail to load — a
 * broken feed must never break because of an unrelated global-content fetch
 * failure.
 */
export async function GET(): Promise<Response> {
  const siteUrl = (await getTenantBaseUrl()) ?? '';

  const hostTenant = await getHostTenantSanityContext();
  if (!hostTenant.isResolvable) {
    return new NextResponse(null, { status: 404 });
  }
  const { tenant } = hostTenant;

  const [postsResult, siteSettingsResult, t] = await Promise.all([
    service.entities.posts.v1.getAllPublishedPosts(tenant),
    service.global.siteSettings.v1.getSiteSettings(tenant),
    getTranslations('rss'),
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
