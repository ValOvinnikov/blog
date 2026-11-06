import type * as TModule from '@web/server/site-config/get-powered-by-mark/get-powered-by-mark';

export const getPoweredByMark = vi.fn<typeof TModule.getPoweredByMark>(
  async () => undefined,
);
