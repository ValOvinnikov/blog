import { CAPABILITY, type TCapability } from '@shinefold/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  isCapabilityEnabled,
  isCapabilityEnabledForTenant,
} from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';

export const isReaderAccountEnabled = (): Promise<boolean> =>
  isCapabilityEnabled(CAPABILITY.READER_ACCOUNTS);

export const isReaderAccountEnabledForTenant = (
  tenantId: string,
): Promise<boolean> =>
  isCapabilityEnabledForTenant(tenantId, CAPABILITY.READER_ACCOUNTS);

/** For a feature nested under Reader accounts (Bookmarks, Comments, Ratings): its own toggle applies only while the main switch is on. */
export const isReaderAccountFeatureEnabledForTenant = async (
  tenantId: string,
  capability: TCapability,
): Promise<boolean> => {
  const [hasReaderAccounts, isFeatureEnabled] = await Promise.all([
    isReaderAccountEnabledForTenant(tenantId),
    isCapabilityEnabledForTenant(tenantId, capability),
  ]);
  return hasReaderAccounts && isFeatureEnabled;
};

/** Server actions run outside the `[tenant]/[locale]` layout, so they gate with `isReaderAccountFeatureEnabledForTenant` instead. */
export const isReaderAccountFeatureEnabled = async (
  capability: TCapability,
): Promise<boolean> => {
  const { tenantId } = await getRequestContext();
  return isReaderAccountFeatureEnabledForTenant(
    tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER,
    capability,
  );
};
