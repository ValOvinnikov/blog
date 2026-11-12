import { ANALYTICS_PROVIDER } from '@blog/config/constants';
import type { TTenantAnalytics } from '@blog/db/queries/tenant-analytics/save-tenant-analytics';
import { createMockFaker } from '@blog/db/testing/mock-faker';

const tenantAnalyticsFaker = createMockFaker(7150);

export const MOCK_GOOGLE_ANALYTICS: TTenantAnalytics = {
  provider: ANALYTICS_PROVIDER.GOOGLE_ANALYTICS,
  analyticsId: `G-${tenantAnalyticsFaker.string.alphanumeric({ length: 10, casing: 'upper' })}`,
};

export const MOCK_PLAUSIBLE_ANALYTICS: TTenantAnalytics = {
  provider: ANALYTICS_PROVIDER.PLAUSIBLE,
  analyticsId: tenantAnalyticsFaker.internet.domainName(),
};
