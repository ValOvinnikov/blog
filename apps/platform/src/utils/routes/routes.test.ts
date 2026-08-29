import { routing } from '@platform/i18n/routing';

import { adminRoutes } from './routes';

describe('adminRoutes', () => {
  it('never includes the locale in the Studio basePaths — localePrefix stays "never"', () => {
    // `basePath` becomes Studio's own client-side router root. If
    // `localePrefix` ever switches to 'always', the locale would start
    // appearing in the URL and this hard-coded assumption would silently
    // break Studio's routing — fail loudly here instead.
    expect(routing.localePrefix).toBe('never');

    expect(adminRoutes.dashboardStudio()).toBe('/dashboard/studio');
    expect(adminRoutes.tenantStudio('tenant-1')).toBe(
      '/tenants/tenant-1/studio',
    );
  });
});
