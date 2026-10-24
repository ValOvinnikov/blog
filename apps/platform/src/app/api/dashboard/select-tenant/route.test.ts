import { HTTP_STATUS } from '@blog/config';
import { MEMBERSHIP_ROLE, ADMIN_ROLE } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import type { Session } from 'next-auth';

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

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const ADMIN_ACTIVE_TENANT = 'admin-active-tenant';
const DASHBOARD_URL = 'https://admin.example.com/dashboard';

describe('GET /api/dashboard/select-tenant', () => {
  let GET: typeof import('./route').GET;

  beforeEach(async () => {
    authMock.mockReset();
    getMembershipMock.mockReset();
    getAdminByUserIdMock.mockReset();
    listTenantsByIdsMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getMembershipMock.mockResolvedValue(undefined);
    getAdminByUserIdMock.mockResolvedValue(undefined);
    ({ GET } = await import('./route'));
  });

  it('redirects to sign-in without checking membership when there is no session', async () => {
    authMock.mockResolvedValue(null);

    const response = await GET(
      new Request(
        `https://admin.example.com/api/dashboard/select-tenant?tenantId=${MOCK_TENANT_ID}`,
      ),
    );

    expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
    expect(response.headers.get('location')).toBe(
      `https://admin.example.com/sign-in?callbackUrl=%2Fapi%2Fdashboard%2Fselect-tenant%3FtenantId%3D${MOCK_TENANT_ID}`,
    );
    expect(getMembershipMock).not.toHaveBeenCalled();
  });

  it('redirects to the picker when no tenantId is given', async () => {
    const response = await GET(
      new Request('https://admin.example.com/api/dashboard/select-tenant'),
    );

    expect(response.headers.get('location')).toBe(
      'https://admin.example.com/dashboard/select-tenant',
    );
    expect(getMembershipMock).not.toHaveBeenCalled();
  });

  it('returns 404 with no cookie for a non-SUPERADMIN with no membership on the tenant', async () => {
    const response = await GET(
      new Request(
        'https://admin.example.com/api/dashboard/select-tenant?tenantId=someone-elses-tenant',
      ),
    );

    expect(getMembershipMock).toHaveBeenCalledWith(
      'user-1',
      'someone-elses-tenant',
    );
    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(response.headers.get('location')).toBeNull();
    expect(response.cookies.get(ADMIN_ACTIVE_TENANT)).toBeUndefined();
  });

  it('sets the active-tenant cookie and redirects to /dashboard for a membership', async () => {
    getMembershipMock.mockResolvedValue({
      id: 'm-1',
      userId: 'user-1',
      tenantId: MOCK_TENANT_ID,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const response = await GET(
      new Request(
        `https://admin.example.com/api/dashboard/select-tenant?tenantId=${MOCK_TENANT_ID}`,
      ),
    );

    expect(response.headers.get('location')).toBe(DASHBOARD_URL);
    expect(response.cookies.get(ADMIN_ACTIVE_TENANT)?.value).toBe(
      MOCK_TENANT_ID,
    );
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  describe('for a SUPERADMIN with no membership', () => {
    beforeEach(() => {
      authMock.mockResolvedValue({ user: { id: 'super-1' } });
      getAdminByUserIdMock.mockResolvedValue({
        id: 'admin-1',
        role: ADMIN_ROLE.SUPERADMIN,
      });
    });

    it('returns 404 when a SUPERADMIN names a tenant that does not exist', async () => {
      listTenantsByIdsMock.mockResolvedValue([]);

      const response = await GET(
        new Request(
          'https://admin.example.com/api/dashboard/select-tenant?tenantId=ghost-tenant',
        ),
      );

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(response.headers.get('location')).toBeNull();
      expect(response.cookies.get(ADMIN_ACTIVE_TENANT)).toBeUndefined();
    });

    it('sets the cookie and redirects to /dashboard for a SUPERADMIN with no membership', async () => {
      listTenantsByIdsMock.mockResolvedValue([{ id: MOCK_TENANT_ID }]);

      const response = await GET(
        new Request(
          `https://admin.example.com/api/dashboard/select-tenant?tenantId=${MOCK_TENANT_ID}`,
        ),
      );

      expect(listTenantsByIdsMock).toHaveBeenCalledWith([MOCK_TENANT_ID]);
      expect(response.headers.get('location')).toBe(DASHBOARD_URL);
      expect(response.cookies.get(ADMIN_ACTIVE_TENANT)?.value).toBe(
        MOCK_TENANT_ID,
      );
    });
  });
});
