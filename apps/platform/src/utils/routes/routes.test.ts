import { routing } from '@platform/i18n/routing';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { adminRoutes } from './routes';

describe('adminRoutes', () => {
  it('never includes the locale in the Studio basePaths — localePrefix stays "never"', () => {
    expect(routing.localePrefix).toBe('never');

    expect(adminRoutes.dashboardStudio()).toBe('/dashboard/studio');
    expect(adminRoutes.tenantStudio(MOCK_TENANT_ID)).toBe(
      `/tenants/${MOCK_TENANT_ID}/studio`,
    );
  });
});
