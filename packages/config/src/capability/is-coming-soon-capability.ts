import {
  COMING_SOON_CAPABILITIES,
  type TCapability,
} from '@blog/config/constants';

export const isComingSoonCapability = (capability: TCapability): boolean =>
  COMING_SOON_CAPABILITIES.some((comingSoon) => comingSoon === capability);
