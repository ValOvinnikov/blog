import { redirect } from 'next/navigation';

import { listSessionTenants } from './list-session-tenants';

const { authMock, listMembershipsForUserMock, listTenantsByIdsMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    listMembershipsForUserMock: vi.fn(),
    listTenantsByIdsMock: vi.fn(),
  }));

vi.mock('./auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    memberships: { listMembershipsForUser: listMembershipsForUserMock },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
  },
}));

describe(listSessionTenants, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsForUserMock.mockReset();
    listTenantsByIdsMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(listSessionTenants()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(listMembershipsForUserMock).not.toHaveBeenCalled();
  });

  it('redirects to /unauthorized when the signed-in user has zero memberships', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([]);

    await expect(listSessionTenants()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/unauthorized');
    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
  });

  it('resolves every tenant behind the memberships row set, not a client-supplied list', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const memberships = [
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
      { id: 'm-2', userId: 'user-1', tenantId: 'tenant-2', role: 'OWNER' },
    ];
    listMembershipsForUserMock.mockResolvedValue(memberships);
    const tenants = [
      { id: 'tenant-1', slug: 'acme' },
      { id: 'tenant-2', slug: 'globex' },
    ];
    listTenantsByIdsMock.mockResolvedValue(tenants);

    const result = await listSessionTenants();

    expect(listMembershipsForUserMock).toHaveBeenCalledWith('user-1');
    expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1', 'tenant-2']);
    expect(result).toEqual({ userId: 'user-1', memberships, tenants });
    expect(redirect).not.toHaveBeenCalled();
  });
});
