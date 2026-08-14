import { queries } from '@blog/db';
import { safeAsync } from '@blog/utils';
import { unstable_cache } from 'next/cache';

const SITE_CONFIG_CACHE_TAG = 'site-config';
const SITE_CONFIG_REVALIDATE_SECONDS = 3600;

/**
 * `apps/web` has no host→tenant resolution yet — that lands with the
 * public site's multi-tenant middleware. Today's deployment serves exactly
 * one tenant, so this takes the sole `tenants` row rather than resolving
 * one per request.
 */
export async function getSoleTenantId(): Promise<string | undefined> {
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
    const tenantId = await getSoleTenantId();
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
