import { HTTP_STATUS, type TMaybeNull } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { auth } from '@platform/server/auth/auth';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_SIGN_IN_USER_ID } from '@platform/testing/auth/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { ACTIVE_TENANT_COOKIE } from '@platform/utils/active-tenant-cookie/active-tenant-cookie';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Session } from 'next-auth';

import { GET } from './route';

faker.seed(5998);

const { getMembershipMock, getAdminByUserIdMock, listTenantsByIdsMock } =
  vi.hoisted(() => ({
    getMembershipMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
    listTenantsByIdsMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { getMembership: getMembershipMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
  },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const MOCK_ORIGIN = faker.internet.url();
const DASHBOARD_URL = new URL(adminRoutes.dashboard(), MOCK_ORIGIN).href;

const getSelectTenant = (tenantId: string) =>
  GET(
    new Request(
      new URL(adminRoutes.dashboardSelectTenantHref(tenantId), MOCK_ORIGIN),
    ),
  );

describe(GET, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
  });

  it('redirects to sign-in without checking membership when signed out', async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await getSelectTenant(MOCK_TENANT_ID);
    const location = response.headers.get('location');

    expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
    expect(location).toBe(
      new URL(
        adminRoutes.signIn(
          adminRoutes.dashboardSelectTenantHref(MOCK_TENANT_ID),
        ),
        MOCK_ORIGIN,
      ).href,
    );
    expect(getMembershipMock).not.toHaveBeenCalled();
  });

  it('redirects to the picker when no tenant is named', async () => {
    const requestUrl = new URL(
      adminRoutes.dashboardSelectTenantHref(MOCK_TENANT_ID),
      MOCK_ORIGIN,
    );
    requestUrl.search = '';

    const response = await GET(new Request(requestUrl));
    const location = response.headers.get('location');

    expect(location).toBe(
      new URL(adminRoutes.dashboardSelectTenant(), MOCK_ORIGIN).href,
    );
    expect(getMembershipMock).not.toHaveBeenCalled();
  });

  it('returns 404 without a cookie for a non-member who is not a superadmin', async () => {
    authMock.mockResolvedValueOnce({ user: { id: MOCK_SIGN_IN_USER_ID } });

    const response = await getSelectTenant(MOCK_OTHER_TENANT_ID);
    const location = response.headers.get('location');
    const cookie = response.cookies.get(ACTIVE_TENANT_COOKIE);

    expect(getMembershipMock).toHaveBeenCalledWith(
      MOCK_SIGN_IN_USER_ID,
      MOCK_OTHER_TENANT_ID,
    );
    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(location).toBeNull();
    expect(cookie).toBeUndefined();
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

    it('returns 404 without a cookie for a tenant that does not exist', async () => {
      listTenantsByIdsMock.mockResolvedValueOnce([]);

      const response = await getSelectTenant(MOCK_OTHER_TENANT_ID);
      const location = response.headers.get('location');
      const cookie = response.cookies.get(ACTIVE_TENANT_COOKIE);

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(location).toBeNull();
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
