import {
  isModuleTypeEntitled,
  MODULE_PACK,
  type TModulePack,
} from '@shinefold/config';
import { MODULE_RENDERER_LOG } from '@web/constants/module-renderer';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getTenantEntitlements } from '@web/server/settings-features/get-tenant-entitlements/get-tenant-entitlements';
import { logger } from '@web/utils/logger/logger';
import { cache } from 'react';

const CORE_MODULE_PACKS: readonly TModulePack[] = [MODULE_PACK.CORE];

const getEntitledModulePacks = cache(
  async (tenantId: string): Promise<readonly TModulePack[]> => {
    const entitlementsResult = await getTenantEntitlements(tenantId);

    if (!entitlementsResult.ok) {
      logger.error(MODULE_RENDERER_LOG.PLAN_FETCH_FAILED, {
        error: entitlementsResult.error,
      });
      return CORE_MODULE_PACKS;
    }

    return entitlementsResult.data?.modulePacks ?? CORE_MODULE_PACKS;
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
