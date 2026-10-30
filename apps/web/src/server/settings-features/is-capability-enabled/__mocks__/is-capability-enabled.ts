import type * as TModule from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';

export const isCapabilityEnabledForTenant = vi.fn<
  typeof TModule.isCapabilityEnabledForTenant
>(async () => false);

export const isCapabilityEnabled = vi.fn<typeof TModule.isCapabilityEnabled>(
  async () => false,
);
