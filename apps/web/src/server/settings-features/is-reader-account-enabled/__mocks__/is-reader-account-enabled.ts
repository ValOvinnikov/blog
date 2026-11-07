import type * as TModule from '@web/server/settings-features/is-reader-account-enabled/is-reader-account-enabled';

export const isReaderAccountEnabled = vi.fn<
  typeof TModule.isReaderAccountEnabled
>(async () => true);

export const isReaderAccountEnabledForTenant = vi.fn<
  typeof TModule.isReaderAccountEnabledForTenant
>(async () => true);

export const isReaderAccountFeatureEnabled = vi.fn<
  typeof TModule.isReaderAccountFeatureEnabled
>(async () => true);
