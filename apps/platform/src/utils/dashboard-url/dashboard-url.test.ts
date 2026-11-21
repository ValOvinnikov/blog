import { MOCK_PLATFORM_APP_BASE_URL } from '@platform/testing/owner-email/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { dashboardUrl } from './dashboard-url';

describe(dashboardUrl, () => {
  it('resolves the tenant’s dashboard path against the platform base URL', () => {
    expect(dashboardUrl(MOCK_TENANT_ID, MOCK_PLATFORM_APP_BASE_URL)).toBe(
      `${MOCK_PLATFORM_APP_BASE_URL}${adminRoutes.dashboardSelectTenantHref(MOCK_TENANT_ID)}`,
    );
  });
});
