import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { isCurrentNavHref } from './is-current-nav-href';

describe(isCurrentNavHref, () => {
  it('matches the row whose href is the pathname', () => {
    expect(
      isCurrentNavHref(adminRoutes.findings(), adminRoutes.findings()),
    ).toBe(true);
  });

  it('does not match a row whose href is another page', () => {
    expect(
      isCurrentNavHref(adminRoutes.tenants(), adminRoutes.findings()),
    ).toBe(false);
  });

  it('matches the Tenants row on the add-tenant route', () => {
    expect(
      isCurrentNavHref(adminRoutes.tenants(), adminRoutes.newTenant()),
    ).toBe(true);
  });

  it('matches no other row on the add-tenant route', () => {
    expect(
      isCurrentNavHref(adminRoutes.findings(), adminRoutes.newTenant()),
    ).toBe(false);
  });

  it('does not match Tenants on a page below it other than add-tenant', () => {
    expect(
      isCurrentNavHref(
        adminRoutes.tenants(),
        adminRoutes.tenantOverview(MOCK_TENANT_ID),
      ),
    ).toBe(false);
  });
});
