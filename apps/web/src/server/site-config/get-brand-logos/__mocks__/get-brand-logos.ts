import type * as TModule from '@web/server/site-config/get-brand-logos/get-brand-logos';

export const getBrandLogos = vi.fn<typeof TModule.getBrandLogos>(
  async () => ({}),
);
