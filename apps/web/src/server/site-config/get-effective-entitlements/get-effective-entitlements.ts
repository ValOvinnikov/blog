import { TENANT_PLAN } from '@shinefold/config/constants';
import {
  resolveTenantEntitlements,
  type TTenantEntitlements,
} from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getTenantEntitlements } from '@web/server/settings-features/get-tenant-entitlements/get-tenant-entitlements';
import { logger } from '@web/utils/logger/logger';
import { cache } from 'react';

const FREE_ENTITLEMENTS = resolveTenantEntitlements(
  TENANT_PLAN.FREE,
  [],
  new Date(),
);

/** What a site renders under: Free's entitlements whenever the tenant's cannot be read. */
export const getEffectiveEntitlements = cache(
  async (tenant: string): Promise<TTenantEntitlements> => {
    const entitlementsResult = await getTenantEntitlements(tenant);

    if (!entitlementsResult.ok) {
      logger.error(SITE_CONFIG_LOG.PLAN_FETCH_FAILED, {
        error: entitlementsResult.error,
      });
      return FREE_ENTITLEMENTS;
    }
    return entitlementsResult.data ?? FREE_ENTITLEMENTS;
  },
);
