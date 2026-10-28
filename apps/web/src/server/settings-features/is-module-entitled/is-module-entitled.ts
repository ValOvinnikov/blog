import {
  isModuleTypeEntitled,
  MODULE_PACK,
  type TModulePack,
} from '@blog/config';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import { MODULE_RENDERER_LOG } from '@web/constants/module-renderer';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getTenantPlan } from '@web/server/settings-features/get-tenant-plan/get-tenant-plan';
import { logger } from '@web/utils/logger/logger';
import { cache } from 'react';

const CORE_MODULE_PACKS: readonly TModulePack[] = [MODULE_PACK.CORE];

const getEntitledModulePacks = cache(
  async (tenantId: string): Promise<readonly TModulePack[]> => {
    const planResult = await getTenantPlan(tenantId);

    if (!planResult.ok) {
      logger.error(MODULE_RENDERER_LOG.PLAN_FETCH_FAILED, {
        error: planResult.error,
      });
      return CORE_MODULE_PACKS;
    }

    const { data: plan } = planResult;
    return plan ? PLAN_ENTITLEMENTS[plan].modulePacks : CORE_MODULE_PACKS;
  },
);

/** With no tenant — the local and dev platform fallback — every module type is entitled. */
export const isModuleEntitled = async (
  moduleType: string,
): Promise<boolean> => {
  const { tenantId } = await getRequestContext();
  if (!tenantId) return true;

  return isModuleTypeEntitled(
    moduleType,
    await getEntitledModulePacks(tenantId),
  );
};
