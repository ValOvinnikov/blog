import { queries } from '@blog/db';
import { safeAsync } from '@blog/utils';
import { unstable_cache } from 'next/cache';

const SITE_CONFIG_CACHE_TAG = 'site-config';
const SITE_CONFIG_REVALIDATE_SECONDS = 3600;

/**
 * Deliberately still resolves the sole `tenants` row rather than the real
 * `proxy.ts` host resolution every other tenant-scoped read now uses.
 * `getSiteConfig` backs the theme `<style>` injector and the next-intl voice
 * ladder, both read on effectively every route (including statically
 * rendered ones) via this `unstable_cache`-wrapped call with a fixed cache
 * key — switching it to the per-request `x-tenant-id` header would require
 * reading a Dynamic API here, opting every one of those routes out of
 * static rendering. That tradeoff — and the tenant-scoped caching contract
 * it would need — is unresolved and undecided; it isn't made implicitly by
 * this migration.
 *
 * TODO: fold this into `resolveTenantId()`/`getRequestTenantId()` once
 * `site_config` reads have a tenant-scoped caching story (#1527).
 */
async function resolveSiteConfigTenantId(): Promise<string | undefined> {
  const [tenant] = await queries.tenants.listTenants();
  return tenant?.id;
}

// `apps/admin`'s Look/Voice saves write `site_config` directly via
// `@blog/db`, then call `/api/revalidate-site-config` (a separate Vercel
// deployment, so this is a cross-app HTTP call rather than a shared cache
// reference) to expire this tag immediately. Absent that call, a save still
// appears live within `SITE_CONFIG_REVALIDATE_SECONDS`.
const getCachedSiteConfig = unstable_cache(
  async () => {
    const tenantId = await resolveSiteConfigTenantId();
    if (!tenantId) return undefined;
    return queries.siteConfig.getSiteConfig(tenantId);
  },
  ['site-config'],
  {
    tags: [SITE_CONFIG_CACHE_TAG],
    revalidate: SITE_CONFIG_REVALIDATE_SECONDS,
  },
);

/**
 * The single `@blog/db` read shared by the theme `<style>` injector
 * (`app/layout.tsx`) and the next-intl voice ladder (`i18n/request.ts`) —
 * one cached row backs both.
 */
export const getSiteConfig = safeAsync(getCachedSiteConfig);
