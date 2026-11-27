import { CAPABILITY, type TCapability } from '@shinefold/config';
import {
  isCapabilityEnabled,
  isCapabilityEnabledForTenant,
} from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';

const isEveryCheckOn = async (
  ...checks: Promise<boolean>[]
): Promise<boolean> => (await Promise.all(checks)).every(Boolean);

export const isReaderAccountEnabled = (): Promise<boolean> =>
  isCapabilityEnabled(CAPABILITY.READER_ACCOUNTS);

export const isReaderAccountEnabledForTenant = (
  tenantId: string,
): Promise<boolean> =>
  isCapabilityEnabledForTenant(tenantId, CAPABILITY.READER_ACCOUNTS);

/** For a feature nested under Reader accounts (Bookmarks, Comments, Ratings): its own toggle applies only while the main switch is on. */
export const isReaderAccountFeatureEnabled = (
  capability: TCapability,
): Promise<boolean> =>
  isEveryCheckOn(isReaderAccountEnabled(), isCapabilityEnabled(capability));

export const isReaderAccountFeatureEnabledForTenant = (
  tenantId: string,
  capability: TCapability,
): Promise<boolean> =>
  isEveryCheckOn(
    isReaderAccountEnabledForTenant(tenantId),
    isCapabilityEnabledForTenant(tenantId, capability),
  );
