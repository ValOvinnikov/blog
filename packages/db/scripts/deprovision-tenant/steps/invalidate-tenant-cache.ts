import type { TMaybeUndefined } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { requestTenantCacheInvalidation } from '@blog/db/utils/tenant-cache/request-tenant-cache-invalidation';

export type TInvalidateTenantCacheEnv = {
  dryRun: boolean;
  webAppUrl: TMaybeUndefined<string>;
  siteConfigRevalidateSecret: TMaybeUndefined<string>;
};

// Runs after archive-tenant: purging while the tenant is still ACTIVE lets a page re-cache before the archive lands.
export async function invalidateTenantCache(
  tenant: TTenant,
  env: TInvalidateTenantCacheEnv,
): Promise<void> {
  if (env.dryRun) {
    console.warn(
      `[dry-run] would invalidate cached pages for tenant "${tenant.id}".`,
    );
    return;
  }

  if (!env.webAppUrl || !env.siteConfigRevalidateSecret) {
    throw new Error(
      `invalidate-tenant-cache: missing WEB_APP_URL or SITE_CONFIG_REVALIDATE_SECRET — cannot invalidate cached pages for archived tenant "${tenant.id}".`,
    );
  }

  await requestTenantCacheInvalidation({
    webAppUrl: env.webAppUrl,
    secret: env.siteConfigRevalidateSecret,
    tenantId: tenant.id,
  });
}
