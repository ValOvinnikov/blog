import { queries, type TTenantPlan } from '@blog/db';
import { safeAsync } from '@blog/utils';
import { buildTenantPlanCacheTag } from '@web/utils/tenant-cache-tags';
import { unstable_cache } from 'next/cache';

import { getRequestTenantId } from './get-request-tenant-id';

const TENANT_PLAN_REVALIDATE_SECONDS = 3600;

const getCachedTenantPlanForTenant = (tenantId: string) =>
  unstable_cache(
    async (id: string): Promise<TTenantPlan | undefined> => {
      const [tenant] = await queries.tenants.listTenantsByIds([id]);
      return tenant?.plan;
    },
    ['tenant-plan', tenantId],
    {
      tags: [buildTenantPlanCacheTag(tenantId)],
      revalidate: TENANT_PLAN_REVALIDATE_SECONDS,
    },
  )(tenantId);

const getUncachedTenantPlan = async (): Promise<TTenantPlan | undefined> => {
  const tenantId = await getRequestTenantId();
  if (!tenantId) return undefined;
  return getCachedTenantPlanForTenant(tenantId);
};

/**
 * getTenantPlan — the `TENANT_PLAN` half of capability entitlement
 * (`isCapabilityEnabled`), cached per tenant the same way `site_config`/
 * `settings_features` are.
 */
export const getTenantPlan = safeAsync(getUncachedTenantPlan);
