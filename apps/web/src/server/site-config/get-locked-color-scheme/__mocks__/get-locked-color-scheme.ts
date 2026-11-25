import type * as TModule from '@web/server/site-config/get-locked-color-scheme/get-locked-color-scheme';

export const getLockedColorScheme = vi.fn<typeof TModule.getLockedColorScheme>(
  async () => undefined,
);
