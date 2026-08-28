import { mockDbConstants } from '@admin/testing/mock-db-constants';

const {
  authMock,
  getMembershipMock,
  getAdminByUserIdMock,
  listTenantsByIdsMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getMembershipMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { getMembership: getMembershipMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
  },
}));

describe('GET /api/dashboard/select-tenant', () => {
  beforeEach(() => {
    authMock.mockReset();
    getMembershipMock.mockReset();
    getAdminByUserIdMock.mockReset();
    listTenantsByIdsMock.mockReset();
  });

  it('redirects to sign-in without checking membership when there is no session', async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import('./route');

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
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { GET } = await import('./route');

    const response = await GET(
      new Request('https://admin.example.com/api/dashboard/select-tenant'),
    );

    expect(response.headers.get('location')).toBe(
      'https://admin.example.com/dashboard/select-tenant',
    );
    expect(getMembershipMock).not.toHaveBeenCalled();
  });

  it('returns 404 without setting a cookie or naming an authorization route when the session has no membership on the requested tenant and is not a SUPERADMIN', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getMembershipMock.mockResolvedValue(undefined);
    getAdminByUserIdMock.mockResolvedValue(undefined);
    const { GET } = await import('./route');

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

  it('returns 404 when a SUPERADMIN names a tenant that does not exist', async () => {
    authMock.mockResolvedValue({ user: { id: 'super-1' } });
    getMembershipMock.mockResolvedValue(undefined);
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });
    listTenantsByIdsMock.mockResolvedValue([]);
    const { GET } = await import('./route');

    const response = await GET(
      new Request(
        'https://admin.example.com/api/dashboard/select-tenant?tenantId=ghost-tenant',
      ),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('location')).toBeNull();
    expect(response.cookies.get('admin-active-tenant')).toBeUndefined();
  });

  it('sets the active-tenant cookie and redirects to /dashboard for a verified membership', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getMembershipMock.mockResolvedValue({
      id: 'm-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'OWNER',
    });
    const { GET } = await import('./route');

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

  it('sets the active-tenant cookie and redirects to /dashboard for a SUPERADMIN with no real membership on an existing tenant', async () => {
    authMock.mockResolvedValue({ user: { id: 'super-1' } });
    getMembershipMock.mockResolvedValue(undefined);
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });
    listTenantsByIdsMock.mockResolvedValue([{ id: 'tenant-1', slug: 'acme' }]);
    const { GET } = await import('./route');

    const response = await GET(
      new Request(
        'https://admin.example.com/api/dashboard/select-tenant?tenantId=tenant-1',
      ),
    );

    expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1']);
    expect(response.headers.get('location')).toBe(
      'https://admin.example.com/dashboard',
    );
    expect(response.cookies.get('admin-active-tenant')?.value).toBe('tenant-1');
  });
});
