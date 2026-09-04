import type { TCapability } from '@blog/config';
import { PLAN_REGISTRY } from '@blog/db';
import { getTenantPlan } from '@web/server/tenant/get-tenant-plan';
import { logger } from '@web/utils/logger/logger';

import { getEffectiveSettingsFeatures } from './get-effective-settings-features';

/**
 * isCapabilityEnabled — most-restrictive-wins capability gate: a capability
 * is enabled only when the tenant's plan entitles it (`PLAN_REGISTRY`) *and*
 * its own effective `settings_features` toggle is on. Every failure path —
 * no tenant resolved, a fetch error — resolves `false` rather than
 * throwing, so a render site can gate on this with a plain `if` and a
 * capability simply omits rather than breaking the page. Accepts the
 * `[tenant]` route param and forwards it to both reads below.
 */
export const isCapabilityEnabled = async (
  capability: TCapability,
  tenant?: string,
): Promise<boolean> => {
  const [planResult, featuresResult] = await Promise.all([
    getTenantPlan(tenant),
    getEffectiveSettingsFeatures(tenant),
  ]);

  if (!planResult.ok) {
    logger.error('settings_features.plan_fetch_failed', {
      capability,
      error: planResult.error,
    });
    return false;
  }
  if (!featuresResult.ok) {
    logger.error('settings_features.effective_fetch_failed', {
      capability,
      error: featuresResult.error,
    });
    return false;
  }

  const { data: plan } = planResult;
  const { data: features } = featuresResult;
  if (!plan || !features) return false;

  return PLAN_REGISTRY[plan].includes(capability) && features[capability];
};
