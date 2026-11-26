import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import type { MetadataRoute } from 'next';

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!isProductionEnvironment()) {
    // Never `Disallow`: crawlers must still fetch pages to see the layout's noindex meta.
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
