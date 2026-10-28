import {
  TENANT_CONFIG_REVALIDATE_SECONDS,
  type TMaybeUndefined,
} from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import { toEffectiveLook } from '@blog/db/utils/effective-look/effective-look';
import { safeAsync, type TResult } from '@blog/utils';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getTenantPlan } from '@web/server/settings-features/get-tenant-plan/get-tenant-plan';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { logger } from '@web/utils/logger/logger';
import { buildSiteConfigCacheTag } from '@web/utils/tenant-cache-tags';
import { unstable_cache } from 'next/cache';

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

const toLookPlan = (
  planResult: TResult<TMaybeUndefined<TTenantPlan>>,
): TTenantPlan => {
  if (!planResult.ok) {
    logger.error(SITE_CONFIG_LOG.PLAN_FETCH_FAILED, {
      error: planResult.error,
    });
    return TENANT_PLAN.FREE;
  }
  return planResult.data ?? TENANT_PLAN.FREE;
};

const getSiteConfigForTenantId = safeAsync(async (tenantId?: string) => {
  if (!tenantId) return undefined;

  const [siteConfig, planResult] = await Promise.all([
    getCachedSiteConfigForTenant(tenantId),
    getTenantPlan(tenantId),
  ]);
  if (!siteConfig) return undefined;

  return toEffectiveLook(siteConfig, toLookPlan(planResult));
});

export const getSiteConfig = async (tenant?: string) =>
  getSiteConfigForTenantId(await getRequestTenantId(tenant));
