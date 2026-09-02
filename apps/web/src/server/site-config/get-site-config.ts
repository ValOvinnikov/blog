import { queries } from '@blog/db';
import { safeAsync } from '@blog/utils';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import { buildSiteConfigCacheTag } from '@web/utils/tenant-cache-tags';
import { unstable_cache } from 'next/cache';

const SITE_CONFIG_REVALIDATE_SECONDS = 3600;

// `apps/platform`'s Look/Voice saves write `site_config` directly via
// `@blog/db`, then call `/api/revalidate-site-config` (a separate Vercel
// deployment, so this is a cross-app HTTP call rather than a shared cache
// reference) to expire this tenant's tag immediately. Absent that call, a
// save still appears live within `SITE_CONFIG_REVALIDATE_SECONDS`.
const getCachedSiteConfigForTenant = (tenantId: string) =>
  unstable_cache(
    (id: string) => queries.siteConfig.getSiteConfig(id),
    ['site-config', tenantId],
    {
      tags: [buildSiteConfigCacheTag(tenantId)],
      revalidate: SITE_CONFIG_REVALIDATE_SECONDS,
    },
  )(tenantId);

const getUncachedSiteConfig = async () => {
  const tenantId = await getRequestTenantId();
  if (!tenantId) return undefined;
  return getCachedSiteConfigForTenant(tenantId);
};

/**
 * The single `@blog/db` read shared by the theme `<style>` injector
 * (`app/layout.tsx`) and the next-intl voice ladder (`i18n/request.ts`) —
 * one cached row backs both, cached per tenant so no tenant is ever served
 * another's config.
 */
export const getSiteConfig = safeAsync(getUncachedSiteConfig);
