import type { TCapability } from '@shinefold/config';
import { SETTINGS_FEATURES_LOG } from '@web/constants/settings-features';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getEffectiveSettingsFeatures } from '@web/server/settings-features/get-effective-settings-features/get-effective-settings-features';
import { getTenantEntitlements } from '@web/server/settings-features/get-tenant-entitlements/get-tenant-entitlements';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { logger } from '@web/utils/logger/logger';

/** A grant raises the ceiling but never switches a capability on: the owner's own toggle must be on as well. */
export const isCapabilityEnabledForTenant = async (
  tenantId: string,
  capability: TCapability,
): Promise<boolean> => {
  const [entitlementsResult, featuresResult] = await Promise.all([
    getTenantEntitlements(tenantId),
    getEffectiveSettingsFeatures(tenantId),
  ]);

  if (!entitlementsResult.ok) {
    logger.error(SETTINGS_FEATURES_LOG.PLAN_FETCH_FAILED, {
      capability,
      error: entitlementsResult.error,
    });
    return false;
  }
  if (!featuresResult.ok) {
    logger.error(SETTINGS_FEATURES_LOG.EFFECTIVE_FETCH_FAILED, {
      capability,
      error: featuresResult.error,
    });
    return false;
  }

  const { data: entitlements } = entitlementsResult;
  const { data: features } = featuresResult;
  if (!entitlements || !features) return false;

  return entitlements.capabilities.includes(capability) && features[capability];
};

/** Server actions run outside the `[tenant]/[locale]` layout, so they gate with `isCapabilityEnabledForTenant` instead. */
export const isCapabilityEnabled = async (
  capability: TCapability,
): Promise<boolean> => {
  const { tenantId } = await getRequestContext();
  return isCapabilityEnabledForTenant(
    tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER,
    capability,
  );
};
