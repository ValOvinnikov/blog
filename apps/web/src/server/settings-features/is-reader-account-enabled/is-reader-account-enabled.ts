import { CAPABILITY, type TCapability } from '@blog/config';
import {
  isCapabilityEnabled,
  isCapabilityEnabledForTenant,
} from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';

export const isReaderAccountEnabled = (): Promise<boolean> =>
  isCapabilityEnabled(CAPABILITY.READER_ACCOUNTS);

export const isReaderAccountEnabledForTenant = (
  tenantId: string,
): Promise<boolean> =>
  isCapabilityEnabledForTenant(tenantId, CAPABILITY.READER_ACCOUNTS);

/** For a feature nested under Reader accounts (Bookmarks, Comments, Ratings): its own toggle applies only while the main switch is on. */
export const isReaderAccountFeatureEnabled = async (
  capability: TCapability,
): Promise<boolean> => {
  const [hasReaderAccounts, isFeatureEnabled] = await Promise.all([
    isReaderAccountEnabled(),
    isCapabilityEnabled(capability),
  ]);
  return hasReaderAccounts && isFeatureEnabled;
};
