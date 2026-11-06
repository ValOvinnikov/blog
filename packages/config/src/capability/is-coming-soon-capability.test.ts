import { CAPABILITY, COMING_SOON_CAPABILITIES } from '@blog/config/constants';

import { isComingSoonCapability } from './is-coming-soon-capability';

const LIVE_CAPABILITIES = Object.values(CAPABILITY).filter(
  (capability) =>
    !COMING_SOON_CAPABILITIES.some((comingSoon) => comingSoon === capability),
);

describe(isComingSoonCapability, () => {
  it.each(COMING_SOON_CAPABILITIES)('is true for %s', (capability) => {
    expect(isComingSoonCapability(capability)).toBe(true);
  });

  it.each(LIVE_CAPABILITIES)('is false for %s', (capability) => {
    expect(isComingSoonCapability(capability)).toBe(false);
  });
});
