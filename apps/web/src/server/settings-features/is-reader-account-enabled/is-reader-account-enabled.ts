import { READER_ACCOUNT_CAPABILITIES, type TCapability } from '@blog/config';
import {
  isCapabilityEnabled,
  isCapabilityEnabledForTenant,
} from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';

const isAnyReaderAccountCapabilityEnabled = async (
  isEnabled: (capability: TCapability) => Promise<boolean>,
): Promise<boolean> => {
  const enabled = await Promise.all(READER_ACCOUNT_CAPABILITIES.map(isEnabled));
  return enabled.some(Boolean);
};

export const isReaderAccountEnabled = (): Promise<boolean> =>
  isAnyReaderAccountCapabilityEnabled(isCapabilityEnabled);

export const isReaderAccountEnabledForTenant = (
  tenantId: string,
): Promise<boolean> =>
  isAnyReaderAccountCapabilityEnabled((capability) =>
    isCapabilityEnabledForTenant(tenantId, capability),
  );
