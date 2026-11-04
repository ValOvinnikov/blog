import type { checkSiteAddressAction as TCheckSiteAddressAction } from '@platform/server/onboarding/check-site-address-action';

export const checkSiteAddressAction = vi.fn<typeof TCheckSiteAddressAction>(
  async () => undefined,
);
