import { TENANT_CONFIG_REVALIDATE_SECONDS } from '@blog/config';
import { queries } from '@blog/db';
import { safeAsync } from '@blog/utils';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import { buildSiteConfigCacheTag } from '@web/utils/tenant-cache-tags';
import { unstable_cache } from 'next/cache';

// `apps/platform`'s Look/Voice saves write `site_config` directly via
// `@blog/db`, then call `/api/revalidate-site-config` (a separate Vercel
// deployment, so this is a cross-app HTTP call rather than a shared cache
// reference) to expire this tenant's tag immediately. Absent that call, a
// save still appears live within `TENANT_CONFIG_REVALIDATE_SECONDS`.
const getCachedSiteConfigForTenant = (tenantId: string) =>
  unstable_cache(
    (id: string) => queries.siteConfig.getSiteConfig(id),
    ['site-config', tenantId],
    {
      tags: [buildSiteConfigCacheTag(tenantId)],
      revalidate: TENANT_CONFIG_REVALIDATE_SECONDS,
    },
  )(tenantId);

// `getRequestTenantId`'s `headers()` read must stay outside this
// `safeAsync` boundary: its `DynamicServerError` is Next's signal that the
// route is dynamic, and swallowing it renders the route static, then 500s.
const getSiteConfigForTenantId = safeAsync(async (tenantId?: string) => {
  if (!tenantId) return undefined;
  return getCachedSiteConfigForTenant(tenantId);
});

/**
 * The single `@blog/db` read shared by `getThemeTokens` (the theme
 * `<style>`/font-variable injector) and `resolveTenantMessages` (the
 * next-intl voice ladder) — one cached row backs both, cached per tenant so
 * no tenant is ever served another's config. Accepts the `[tenant]` route
 * param and forwards it to `getRequestTenantId`.
 */
export const getSiteConfig = async (tenant?: string) =>
  getSiteConfigForTenantId(await getRequestTenantId(tenant));
