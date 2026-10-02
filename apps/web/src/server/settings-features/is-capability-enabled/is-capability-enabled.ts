import type { TCapability } from '@blog/config';
import { PLAN_REGISTRY } from '@blog/db';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getEffectiveSettingsFeatures } from '@web/server/settings-features/get-effective-settings-features/get-effective-settings-features';
import { getTenantPlan } from '@web/server/settings-features/get-tenant-plan/get-tenant-plan';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { logger } from '@web/utils/logger/logger';


/**
 * Most-restrictive-wins capability gate: a capability is enabled only when
 * the tenant's plan entitles it (`PLAN_REGISTRY`) *and* its own effective
 * `settings_features` toggle is on. Every failure path — no tenant
 * resolved, a fetch error — resolves `false` rather than throwing, so a
 * render site can gate on this with a plain `if` and a capability simply
 * omits rather than breaking the page.
 */
export const isCapabilityEnabled = async (
  capability: TCapability,
): Promise<boolean> => {
  const { tenantId } = await getRequestContext();
  const tenant = tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER;
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
