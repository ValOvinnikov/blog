import { TENANT_CONFIG_REVALIDATE_SECONDS } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { toEffectiveLookWithin } from '@shinefold/db/utils/effective-look/effective-look';
import { safeAsync } from '@shinefold/utils';
import { getEffectiveEntitlements } from '@web/server/site-config/get-effective-entitlements/get-effective-entitlements';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { buildSiteConfigCacheTag } from '@web/utils/tenant-cache-tags';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

// The platform's Look/Voice saves expire this tag over HTTP (`/api/revalidate-site-config`), since the apps share no cache.
const getCachedSiteConfigForTenant = (tenantId: string) =>
  unstable_cache(
    (id: string) => queries.siteConfig.getSiteConfig(id),
    ['site-config', tenantId],
    {
      tags: [buildSiteConfigCacheTag(tenantId)],
      revalidate: TENANT_CONFIG_REVALIDATE_SECONDS,
    },
  )(tenantId);

const getSiteConfigForTenantId = cache(
  safeAsync(async (tenantId?: string) => {
    if (!tenantId) return undefined;

    const [siteConfig, entitlements] = await Promise.all([
      getCachedSiteConfigForTenant(tenantId),
      getEffectiveEntitlements(tenantId),
    ]);
    if (!siteConfig) return undefined;

    return toEffectiveLookWithin(siteConfig, entitlements);
  }),
);

export const getSiteConfig = async (tenant?: string) =>
  getSiteConfigForTenantId(await getRequestTenantId(tenant));
