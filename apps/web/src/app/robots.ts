import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import type { MetadataRoute } from 'next';

/**
 * Production: allows every crawler and points at the sitemap. No resolvable
 * base URL falls back to a relative `/sitemap.xml` rather than an empty
 * sitemap field — unlike `sitemap.ts`'s entries, a relative sitemap
 * reference here is still valid (resolved relative to `robots.txt`'s own
 * origin) so there is no need to omit it.
 *
 * Non-production (e.g. `development` after a prod→dev dataset refresh):
 * `[locale]/layout.tsx`'s `generateMetadata` already emits a page-level
 * `<meta name="robots" content="noindex, nofollow">` on every route, and
 * that meta tag — not this file — is the authoritative de-indexing lever.
 * Crawling is deliberately left `allow: '/'` here rather than switched to
 * `Disallow: /`: a blanket disallow would stop crawlers from ever
 * *fetching* a page, which means they'd never see its `noindex` meta tag
 * either (a disallowed URL can still be indexed by URL alone, just without
 * a description) — the opposite of what we want. The sitemap is omitted
 * instead, since there's no reason to actively invite crawling of a
 * non-production environment even though it isn't blocked outright.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!isProductionEnvironment()) {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
      },
    };
  }

  const siteUrl = (await getTenantBaseUrl()) ?? '';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
