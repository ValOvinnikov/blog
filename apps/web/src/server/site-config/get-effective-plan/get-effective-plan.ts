import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getTenantPlan } from '@web/server/settings-features/get-tenant-plan/get-tenant-plan';
import { logger } from '@web/utils/logger/logger';
import { cache } from 'react';

/** The plan whose rules a site renders under: Free whenever the tenant's plan cannot be read. */
export const getEffectivePlan = cache(
  async (tenant: string): Promise<TTenantPlan> => {
    const planResult = await getTenantPlan(tenant);

    if (!planResult.ok) {
      logger.error(SITE_CONFIG_LOG.PLAN_FETCH_FAILED, {
        error: planResult.error,
      });
      return TENANT_PLAN.FREE;
    }
    return planResult.data ?? TENANT_PLAN.FREE;
  },
);
