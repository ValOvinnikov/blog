import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import { listSessionTenants } from './list-session-tenants';

const {
  authMock,
  listMembershipsForUserMock,
  listTenantsByIdsMock,
  listTenantsMock,
  getAdminByUserIdMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  listMembershipsForUserMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  listTenantsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('./auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { listMembershipsForUser: listMembershipsForUserMock },
    tenants: {
      listTenantsByIds: listTenantsByIdsMock,
      listTenants: listTenantsMock,
    },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

describe(listSessionTenants, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsForUserMock.mockReset();
    listTenantsByIdsMock.mockReset();
    listTenantsMock.mockReset();
    getAdminByUserIdMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(listSessionTenants()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(listMembershipsForUserMock).not.toHaveBeenCalled();
  });

  it('redirects to /workspace-pending when the signed-in user has zero memberships and is not a SUPERADMIN', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listMembershipsForUserMock.mockResolvedValue([]);

    await expect(listSessionTenants()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/workspace-pending');
    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
  });

  it.each(['ADMIN', 'MODERATOR'])(
    'redirects to /workspace-pending for a %s admins row with zero memberships',
    async (role) => {
      authMock.mockResolvedValue({ user: { id: 'user-1' } });
      getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role });
      listMembershipsForUserMock.mockResolvedValue([]);

      await expect(listSessionTenants()).rejects.toThrow('NEXT_REDIRECT');

      expect(redirect).toHaveBeenCalledWith('/workspace-pending');
      expect(listTenantsMock).not.toHaveBeenCalled();
    },
  );

  it('resolves every tenant behind the memberships row set, not a client-supplied list', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);
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

  it('resolves every tenant in the system for a SUPERADMIN, regardless of their own memberships row count', async () => {
    authMock.mockResolvedValue({ user: { id: 'super-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });
    const tenants = [
      { id: 'tenant-1', slug: 'acme' },
      { id: 'tenant-2', slug: 'globex' },
      { id: 'tenant-3', slug: 'initech' },
    ];
    listTenantsMock.mockResolvedValue(tenants);

    const result = await listSessionTenants();

    expect(listTenantsMock).toHaveBeenCalledWith();
    expect(listMembershipsForUserMock).not.toHaveBeenCalled();
    expect(result.userId).toBe('super-1');
    expect(result.tenants).toEqual(tenants);
    expect(result.memberships).toHaveLength(3);
    expect(
      result.memberships.every(
        (membership) =>
          membership.role === 'OWNER' && membership.userId === 'super-1',
      ),
    ).toBe(true);
    expect(redirect).not.toHaveBeenCalled();
  });
});
