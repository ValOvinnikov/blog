import {
  TENANT_CONFIG_REVALIDATE_SECONDS,
  type TMaybeUndefined,
} from '@blog/config';
import type { TTenantPlan } from '@blog/config/constants';
import { queries } from '@blog/db';
import { safeAsync } from '@blog/utils';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { buildTenantPlanCacheTag } from '@web/utils/tenant-cache-tags';
import { unstable_cache } from 'next/cache';

const getCachedTenantPlanForTenant = (tenantId: string) =>
  unstable_cache(
    async (id: string): Promise<TMaybeUndefined<TTenantPlan>> => {
      const tenant = await queries.tenants.getTenantById(id, {
        includeArchived: true,
      });
      return tenant?.plan;
    },
    ['tenant-plan', tenantId],
    {
      tags: [buildTenantPlanCacheTag(tenantId)],
      revalidate: TENANT_CONFIG_REVALIDATE_SECONDS,
    },
  )(tenantId);

const getTenantPlanForTenantId = safeAsync(
  async (tenantId?: string): Promise<TMaybeUndefined<TTenantPlan>> => {
    if (!tenantId) return undefined;
    return getCachedTenantPlanForTenant(tenantId);
  },
);

export const getTenantPlan = async (tenant: string) =>
  getTenantPlanForTenantId(await getRequestTenantId(tenant));
