import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@blog/config';
import { routing } from '@platform/i18n/routing';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import { DEFAULT_TENANTS_SORT } from '@platform/utils/tenants-list-query/tenants-list-query';

import { adminRoutes, STUDIO_SEGMENT } from './routes';

describe('adminRoutes', () => {
  it('keeps the locale out of the Studio basePaths', () => {
    expect(routing.localePrefix).toBe('never');

    expect(adminRoutes.dashboardStudio()).toBe(`/dashboard/${STUDIO_SEGMENT}`);
    expect(adminRoutes.tenantStudio(MOCK_TENANT_ID)).toBe(
      `/tenants/${MOCK_TENANT_ID}/${STUDIO_SEGMENT}`,
    );
  });

  describe('tenants', () => {
    it('leaves the default visibility, sort and search out of the URL', () => {
      const href = adminRoutes.tenants({
        shouldShowArchived: false,
        sort: DEFAULT_TENANTS_SORT,
        search: '',
      });

      expect(href).toBe('/tenants');
    });

    it('carries the archived flag, a chosen sort and the search', () => {
      const href = adminRoutes.tenants({
        shouldShowArchived: true,
        sort: {
          column: TENANT_SORT_COLUMN.CREATED,
          direction: SORT_DIRECTION.ASCENDING,
        },
        search: MOCK_TENANT_SLUG,
      });

      expect(href).toBe(
        `/tenants?archived=1&sort=CREATED&direction=ascending&q=${MOCK_TENANT_SLUG}`,
      );
    });
  });
});
