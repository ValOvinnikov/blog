import type * as TModule from '@web/server/settings-features/is-module-entitled/is-module-entitled';

export const isModuleEntitled = vi.fn<typeof TModule.isModuleEntitled>(
  async () => true,
);
