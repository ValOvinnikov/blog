import { auth } from '@platform/server/auth/auth';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
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
        'https://admin.example.com/api/dashboard/select-tenant?tenantId=tenant-1',
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://admin.example.com/api/auth/signin',
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
    expect(response.status).toBe(404);
    expect(response.headers.get('location')).toBeNull();
    expect(response.cookies.get('admin-active-tenant')).toBeUndefined();
  });

  it('sets the active-tenant cookie and redirects to /dashboard for a membership', async () => {
    getMembershipMock.mockResolvedValue({
      id: 'm-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'OWNER',
    });

    const response = await GET(
      new Request(
        'https://admin.example.com/api/dashboard/select-tenant?tenantId=tenant-1',
      ),
    );

    expect(response.headers.get('location')).toBe(
      'https://admin.example.com/dashboard',
    );
    expect(response.cookies.get('admin-active-tenant')?.value).toBe('tenant-1');
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  describe('for a SUPERADMIN with no membership', () => {
    beforeEach(() => {
      authMock.mockResolvedValue({ user: { id: 'super-1' } });
      getAdminByUserIdMock.mockResolvedValue({
        id: 'admin-1',
        role: 'SUPERADMIN',
      });
    });

    it('returns 404 when a SUPERADMIN names a tenant that does not exist', async () => {
      listTenantsByIdsMock.mockResolvedValue([]);

      const response = await GET(
        new Request(
          'https://admin.example.com/api/dashboard/select-tenant?tenantId=ghost-tenant',
        ),
      );

      expect(response.status).toBe(404);
      expect(response.headers.get('location')).toBeNull();
      expect(response.cookies.get('admin-active-tenant')).toBeUndefined();
    });

    it('sets the cookie and redirects to /dashboard for a SUPERADMIN with no membership', async () => {
      listTenantsByIdsMock.mockResolvedValue([{ id: 'tenant-1' }]);

      const response = await GET(
        new Request(
          'https://admin.example.com/api/dashboard/select-tenant?tenantId=tenant-1',
        ),
      );

      expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1']);
      expect(response.headers.get('location')).toBe(
        'https://admin.example.com/dashboard',
      );
      expect(response.cookies.get('admin-active-tenant')?.value).toBe(
        'tenant-1',
      );
    });
  });
});
