import type * as TModule from '@web/server/site-config/get-site-analytics/get-site-analytics';

export const getSiteAnalytics = vi.fn<typeof TModule.getSiteAnalytics>(
  async () => undefined,
);
