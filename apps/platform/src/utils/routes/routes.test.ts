import { routing } from '@platform/i18n/routing';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { adminRoutes, STUDIO_SEGMENT } from './routes';

describe('adminRoutes', () => {
  it('keeps the locale out of the Studio basePaths', () => {
    expect(routing.localePrefix).toBe('never');

    expect(adminRoutes.dashboardStudio()).toBe(`/dashboard/${STUDIO_SEGMENT}`);
    expect(adminRoutes.tenantStudio(MOCK_TENANT_ID)).toBe(
      `/tenants/${MOCK_TENANT_ID}/${STUDIO_SEGMENT}`,
    );
  });
});
