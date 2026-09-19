import { TENANT_CONFIG_REVALIDATE_SECONDS } from '@blog/config';
import { queries, type TTenantPlan } from '@blog/db';
import { safeAsync } from '@blog/utils';
import { buildTenantPlanCacheTag } from '@web/utils/tenant-cache-tags';
import { unstable_cache } from 'next/cache';

import { getRequestTenantId } from './get-request-tenant-id';

const getCachedTenantPlanForTenant = (tenantId: string) =>
  unstable_cache(
    async (id: string): Promise<TTenantPlan | undefined> => {
      const [tenant] = await queries.tenants.listTenantsByIds([id]);
      return tenant?.plan;
    },
    ['tenant-plan', tenantId],
    {
      tags: [buildTenantPlanCacheTag(tenantId)],
      revalidate: TENANT_CONFIG_REVALIDATE_SECONDS,
    },
  )(tenantId);

const getTenantPlanForTenantId = safeAsync(
  async (tenantId?: string): Promise<TTenantPlan | undefined> => {
    if (!tenantId) return undefined;
    return getCachedTenantPlanForTenant(tenantId);
  },
);

/**
 * The `TENANT_PLAN` half of capability entitlement (`isCapabilityEnabled`),
 * cached per tenant the same way `site_config`/`settings_features` are.
 */
export const getTenantPlan = async (tenant?: string) =>
  getTenantPlanForTenantId(await getRequestTenantId(tenant));
