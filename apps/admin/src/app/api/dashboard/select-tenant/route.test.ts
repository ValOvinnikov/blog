export {};

const { authMock, getMembershipMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getMembershipMock: vi.fn(),
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: { memberships: { getMembership: getMembershipMock } },
}));

describe('GET /api/dashboard/select-tenant', () => {
  beforeEach(() => {
    authMock.mockReset();
    getMembershipMock.mockReset();
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

  it('redirects to /unauthorized without setting a cookie when the session has no membership on the requested tenant', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getMembershipMock.mockResolvedValue(undefined);
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
    expect(response.headers.get('location')).toBe(
      'https://admin.example.com/unauthorized',
    );
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
  });
});
