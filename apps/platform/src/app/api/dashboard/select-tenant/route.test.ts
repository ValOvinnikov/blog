import { faker } from '@faker-js/faker';
import { NO_ACCESS_REASON } from '@platform/constants/no-access';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_PLATFORM_ORIGIN,
  MOCK_SIGN_IN_USER_ID,
} from '@platform/testing/auth/fixtures';
import { mockedPartialAuth } from '@platform/testing/auth/mocked-auth';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { ACTIVE_TENANT_COOKIE } from '@platform/utils/active-tenant-cookie/active-tenant-cookie';
import { adminRoutes } from '@platform/utils/routes/routes';
import { HTTP_STATUS } from '@shinefold/config';
import { ADMIN_ROLE } from '@shinefold/db/constants';

import { GET } from './route';

faker.seed(5998);

const { getMembershipMock, getAdminByUserIdMock, listTenantsByIdsMock } =
  vi.hoisted(() => ({
    getMembershipMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
    listTenantsByIdsMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/auth');

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { getMembership: getMembershipMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
  },
}));

const DASHBOARD_URL = new URL(adminRoutes.dashboard(), MOCK_PLATFORM_ORIGIN)
  .href;
const NO_SITE_ACCESS_URL = new URL(
  adminRoutes.noAccess(NO_ACCESS_REASON.SITE),
  MOCK_PLATFORM_ORIGIN,
).href;

const getHref = (href: string) =>
  GET(new Request(new URL(href, MOCK_PLATFORM_ORIGIN)));

const getSelectTenant = (tenantId: string) =>
  getHref(adminRoutes.dashboardSelectTenantHref(tenantId));

describe(GET, () => {
  beforeEach(() => {
    mockedPartialAuth.mockReset();
    getAdminByUserIdMock.mockReset();
  });

  it('redirects to sign-in without checking membership when signed out', async () => {
    mockedPartialAuth.mockResolvedValueOnce(null);

    const response = await getSelectTenant(MOCK_TENANT_ID);
    const location = response.headers.get('location');

    expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
    expect(location).toBe(
      new URL(
        adminRoutes.signIn(
          adminRoutes.dashboardSelectTenantHref(MOCK_TENANT_ID),
        ),
        MOCK_PLATFORM_ORIGIN,
      ).href,
    );
    expect(getMembershipMock).not.toHaveBeenCalled();
  });

  it('redirects to the picker when no tenant is named', async () => {
    const requestUrl = new URL(
      adminRoutes.dashboardSelectTenantHref(MOCK_TENANT_ID),
      MOCK_PLATFORM_ORIGIN,
    );
    requestUrl.search = '';

    const response = await GET(new Request(requestUrl));
    const location = response.headers.get('location');

    expect(location).toBe(
      new URL(adminRoutes.dashboardSelectTenant(), MOCK_PLATFORM_ORIGIN).href,
    );
    expect(getMembershipMock).not.toHaveBeenCalled();
  });

  describe('for a signed-in non-member', () => {
    beforeEach(() => {
      mockedPartialAuth.mockResolvedValueOnce({
        user: { id: MOCK_SIGN_IN_USER_ID },
      });
    });

    it('sends them to the no-access page without a cookie', async () => {
      const response = await getSelectTenant(MOCK_OTHER_TENANT_ID);
      const location = response.headers.get('location');
      const cookie = response.cookies.get(ACTIVE_TENANT_COOKIE);

      expect(getMembershipMock).toHaveBeenCalledWith(
        MOCK_SIGN_IN_USER_ID,
        MOCK_OTHER_TENANT_ID,
      );
      expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
      expect(location).toBe(NO_SITE_ACCESS_URL);
      expect(cookie).toBeUndefined();
    });

    it('says an invite cannot be used to a non-member arriving from one', async () => {
      const response = await getHref(
        adminRoutes.dashboardSelectTenantFromInviteHref(MOCK_OTHER_TENANT_ID),
      );
      const location = response.headers.get('location');
      const cookie = response.cookies.get(ACTIVE_TENANT_COOKIE);

      expect(location).toBe(
        new URL(
          adminRoutes.noAccess(NO_ACCESS_REASON.SITE_INVITE),
          MOCK_PLATFORM_ORIGIN,
        ).href,
      );
      expect(cookie).toBeUndefined();
    });
  });

  it('sets the active-tenant cookie and opens the dashboard for a member', async () => {
    getMembershipMock.mockResolvedValueOnce(mockMembership());

    const response = await getSelectTenant(MOCK_TENANT_ID);
    const location = response.headers.get('location');
    const cookie = response.cookies.get(ACTIVE_TENANT_COOKIE);

    expect(location).toBe(DASHBOARD_URL);
    expect(cookie?.value).toBe(MOCK_TENANT_ID);
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  describe('for a superadmin with no membership', () => {
    beforeEach(() => {
      getAdminByUserIdMock.mockResolvedValue(
        mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
      );
    });

    it('sends them to the no-access page for a missing tenant', async () => {
      listTenantsByIdsMock.mockResolvedValueOnce([]);

      const response = await getSelectTenant(MOCK_OTHER_TENANT_ID);
      const location = response.headers.get('location');
      const cookie = response.cookies.get(ACTIVE_TENANT_COOKIE);

      expect(location).toBe(NO_SITE_ACCESS_URL);
      expect(cookie).toBeUndefined();
    });

    it('sets the active-tenant cookie and opens the dashboard', async () => {
      listTenantsByIdsMock.mockResolvedValueOnce([mockTenant()]);

      const response = await getSelectTenant(MOCK_TENANT_ID);
      const location = response.headers.get('location');
      const cookie = response.cookies.get(ACTIVE_TENANT_COOKIE);

      expect(listTenantsByIdsMock).toHaveBeenCalledWith([MOCK_TENANT_ID]);
      expect(location).toBe(DASHBOARD_URL);
      expect(cookie?.value).toBe(MOCK_TENANT_ID);
    });
  });
});
