import { env } from '@web/utils/env/env';
import type { MetadataRoute } from 'next';

/**
 * Allows every crawler and points at the sitemap. `NEXT_PUBLIC_SITE_URL`
 * unset falls back to a relative `/sitemap.xml` rather than an empty
 * sitemap field — unlike `sitemap.ts`'s entries, a relative sitemap
 * reference here is still valid (resolved relative to `robots.txt`'s own
 * origin) so there is no need to omit it.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
