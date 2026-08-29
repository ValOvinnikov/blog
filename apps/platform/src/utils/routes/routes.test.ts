import { routing } from '@platform/i18n/routing';

import { adminRoutes } from './routes';

describe('adminRoutes', () => {
  it('never includes the locale in the Studio basePaths — localePrefix stays "never"', () => {
    expect(routing.localePrefix).toBe('never');

    expect(adminRoutes.dashboardStudio()).toBe('/dashboard/studio');
    expect(adminRoutes.tenantStudio('tenant-1')).toBe(
      '/tenants/tenant-1/studio',
    );
  });
});
