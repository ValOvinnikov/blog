import { toStarterSiteType } from '@shinefold/config';
import { sanitizeLogMessage } from '@shinefold/insight';
import { GROWTH_LAYER_LOG } from '@worker/constants/growth-layer';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { applyGrowthLayer } from '@worker/steps/apply-growth-layer';
import { isGrowthLayerEntitled } from '@worker/utils/growth-layer/growth-layer-entitlement';
import { logger } from '@worker/utils/logger/logger';
import { createTenantWriteClient } from '@worker/utils/tenant-content/tenant-write-client';

import { isFinalStepAttempt, loadTenant } from './run-reported-step';

export async function ensureGrowthLayerApplied(
  tenantId: string,
): Promise<void> {
  'use step';

  try {
    const tenant = await loadTenant(tenantId);
    if (!(await isGrowthLayerEntitled(tenant))) return;

    const client = await createTenantWriteClient(tenantId);
    await applyGrowthLayer({
      siteType: toStarterSiteType(tenant.siteType),
      locale: tenant.locale,
    })(client);
  } catch (error) {
    if (isFinalStepAttempt(error)) {
      logger.error(GROWTH_LAYER_LOG.APPLY_FAILED, {
        tenantId,
        error: sanitizeLogMessage(error),
      });
    }
    throw error;
  }
}

ensureGrowthLayerApplied.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
