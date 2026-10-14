import { LOCALE_BCP47_TAGS, routes, type TMaybeUndefined } from '@blog/config';
import type { TFeedPost, TTenantSanityContext } from '@blog/service';
import { routing } from '@web/i18n/routing';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { getHostTenantSanityContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import type { TRssItem } from '@web/utils/build-rss-feed';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';
import { hasLocale } from 'next-intl';

export type TFeedContext = {
  tenant: TTenantSanityContext;
  language: string;
  toLocalizedUrl: (href: string) => string;
  toRssItem: (post: TFeedPost) => TRssItem;
};

export const getFeedContext = async (
  locale: string,
): Promise<TMaybeUndefined<TFeedContext>> => {
  if (!hasLocale(routing.locales, locale)) {
    return undefined;
  }

  const hostTenant = await getHostTenantSanityContext();
  if (!hostTenant.isResolvable) {
    return undefined;
  }

  const { tenant } = hostTenant;
  const defaultLocale = tenant.defaultLocale ?? routing.defaultLocale;
  const siteUrl = (await getTenantBaseUrl()) ?? '';
  const toLocalizedUrl = (href: string) => {
    const pathname = toLocalizedPathname({ href, locale, defaultLocale });

    return pathname === '/' ? siteUrl : `${siteUrl}${pathname}`;
  };

  return {
    tenant: { ...tenant, locale },
    language: LOCALE_BCP47_TAGS[locale],
    toLocalizedUrl,
    toRssItem: ({ title, slug, excerpt, publishedAt }) => ({
      title,
      link: toLocalizedUrl(routes.post(slug)),
      description: excerpt,
      publishedAt,
    }),
  };
};
