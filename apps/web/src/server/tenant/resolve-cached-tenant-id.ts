import { queries } from '@blog/db';

/**
 * The tenant resolution shared by every `unstable_cache`-wrapped,
 * fixed-cache-key tenant read (`site_config`, `settings_features`, tenant
 * plan) — same "first tenants row" approach `get-site-config.ts`'s own
 * private resolver uses, kept here as the shared copy so new cached readers
 * don't each grow their own. Reading the per-request `x-tenant-id` header
 * here instead would opt every route consuming these reads out of static
 * rendering.
 */
export const resolveCachedTenantId = async (): Promise<string | undefined> => {
  const [tenant] = await queries.tenants.listTenants();
  return tenant?.id;
};
