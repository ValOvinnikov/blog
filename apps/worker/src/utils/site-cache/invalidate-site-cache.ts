import { requestTenantCacheInvalidation } from '@shinefold/db/utils/tenant-cache/request-tenant-cache-invalidation';

type TSiteCacheEnv = {
  webAppBaseUrl: string;
  siteConfigRevalidateSecret: string;
};

export function invalidateSiteCache(
  tenantId: string,
  { webAppBaseUrl, siteConfigRevalidateSecret }: TSiteCacheEnv,
): Promise<void> {
  return requestTenantCacheInvalidation({
    webAppUrl: webAppBaseUrl,
    secret: siteConfigRevalidateSecret,
    tenantId,
  });
}
