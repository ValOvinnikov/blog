import { TENANT_CONFIG_REVALIDATE_SECONDS } from '@blog/config';
import { queries } from '@blog/db';
import { toEffectiveLook } from '@blog/db/utils/effective-look/effective-look';
import { safeAsync } from '@blog/utils';
import { getEffectivePlan } from '@web/server/site-config/get-effective-plan/get-effective-plan';
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

    const [siteConfig, plan] = await Promise.all([
      getCachedSiteConfigForTenant(tenantId),
      getEffectivePlan(tenantId),
    ]);
    if (!siteConfig) return undefined;

    return toEffectiveLook(siteConfig, plan);
  }),
);

export const getSiteConfig = async (tenant?: string) =>
  getSiteConfigForTenantId(await getRequestTenantId(tenant));
