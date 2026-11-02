import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { isCurrentNavHref } from './is-current-nav-href';

const MOCK_STUDIO_TOOL_PATH = `/${faker.lorem.slug()}/${faker.lorem.slug()}`;

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

  it.each([
    ['owner', adminRoutes.dashboardStudio()],
    ['operator', adminRoutes.tenantStudio(MOCK_TENANT_ID)],
  ])('matches the %s Studio row at an inner Studio path', (_, studioHref) => {
    expect(
      isCurrentNavHref(studioHref, `${studioHref}${MOCK_STUDIO_TOOL_PATH}`),
    ).toBe(true);
  });

  it('matches no other row at an inner Studio path', () => {
    const pathname = `${adminRoutes.tenantStudio(MOCK_TENANT_ID)}${MOCK_STUDIO_TOOL_PATH}`;

    expect(
      isCurrentNavHref(adminRoutes.tenantOverview(MOCK_TENANT_ID), pathname),
    ).toBe(false);
    expect(isCurrentNavHref(adminRoutes.look(MOCK_TENANT_ID), pathname)).toBe(
      false,
    );
  });

  it('does not match a non-Studio row at a path below it', () => {
    expect(
      isCurrentNavHref(
        adminRoutes.dashboardLook(),
        `${adminRoutes.dashboardLook()}${MOCK_STUDIO_TOOL_PATH}`,
      ),
    ).toBe(false);
  });
});
