import { HTTP_STATUS, type ITenantLocalizedParams, routes } from '@blog/config';
import { service } from '@blog/service';
import { RSS_LOG } from '@web/constants/rss';
import { getFeedContext } from '@web/server/feed/get-feed-context/get-feed-context';
import { buildRssFeed } from '@web/utils/build-rss-feed';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';

type TProps = {
  params: Promise<Omit<ITenantLocalizedParams, 'locale'> & { locale: string }>;
};

/**
 * A failed global-content fetch falls back to a generic channel title and
 * description: the feed must not break on an unrelated fetch.
 */
export async function GET(
  _request: Request,
  { params }: TProps,
): Promise<Response> {
  const { locale } = await params;
  const feed = await getFeedContext(locale);
  if (!feed) {
    return new NextResponse(null, { status: HTTP_STATUS.NOT_FOUND });
  }
  const { tenant, language, toLocalizedUrl, toRssItem } = feed;

  const [postsResult, siteSettingsResult, indexPageResult, navResult, t] =
    await Promise.all([
      service.entities.posts.v1.getAllPublishedPosts(tenant),
      service.global.siteSettings.v1.getSiteSettings(tenant),
      service.pages.blog.v1.getIndexPage(tenant),
      service.global.navigation.v1.getNavigation(tenant),
      getTranslations({ locale, namespace: 'rss' }),
    ]);

  // A single unpaginated query: a failure yields the whole feed empty, not a
  // partially-populated one.
  if (!postsResult.ok) {
    logger.error(RSS_LOG.POSTS_FETCH_FAILED, { error: postsResult.error });
  }
  const posts = postsResult.ok ? postsResult.data : [];

  const title = siteSettingsResult.ok
    ? siteSettingsResult.data.brand.name
    : t('fallbackTitle');
  if (!siteSettingsResult.ok) {
    logger.error(RSS_LOG.SITE_SETTINGS_FETCH_FAILED, {
      error: siteSettingsResult.error,
    });
  }

  if (!indexPageResult.ok) {
    logger.error(RSS_LOG.INDEX_PAGE_FETCH_FAILED, {
      error: indexPageResult.error,
    });
  }
  if (!navResult.ok) {
    logger.error(RSS_LOG.NAVIGATION_FETCH_FAILED, { error: navResult.error });
  }
  const description =
    (indexPageResult.ok && indexPageResult.data?.seo.description) ||
    (navResult.ok && navResult.data.tagline) ||
    t('fallbackDescription');

  const xml = buildRssFeed(
    {
      title,
      description,
      link: toLocalizedUrl(routes.home()),
      language,
      feedUrl: toLocalizedUrl(routes.rssFeed()),
    },
    posts.map(toRssItem),
  );

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
