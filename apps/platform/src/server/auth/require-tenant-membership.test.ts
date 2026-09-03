import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import { requireTenantMembership } from './require-tenant-membership';

const { authMock, getTenantByIdMock, getMembershipMock, getAdminByUserIdMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
    getMembershipMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
  }));

vi.mock('./auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { getTenantById: getTenantByIdMock },
    memberships: { getMembership: getMembershipMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

describe(requireTenantMembership, () => {
  beforeEach(() => {
    authMock.mockReset();
    getTenantByIdMock.mockReset();
    getMembershipMock.mockReset();
    getAdminByUserIdMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying the tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireTenantMembership('tenant-1')).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('404s for an unknown tenant id without checking membership or admin role', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(requireTenantMembership('ghost')).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(getMembershipMock).not.toHaveBeenCalled();
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('404s — the same outcome as an unknown id — when the signed-in user has no admins row and no membership on that tenant', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantByIdMock.mockResolvedValue({ id: 'tenant-1' });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getMembershipMock.mockResolvedValue(undefined);

    await expect(requireTenantMembership('tenant-1')).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(getMembershipMock).toHaveBeenCalledWith('user-1', 'tenant-1');
    expect(redirect).not.toHaveBeenCalled();
  });

  it.each(['ADMIN', 'MODERATOR', 'SUPERADMIN'])(
    'grants a %s admins row OWNER-level access with no real membership on that tenant, without redirecting',
    async (role) => {
      authMock.mockResolvedValue({ user: { id: 'user-1' } });
      getTenantByIdMock.mockResolvedValue({ id: 'tenant-1' });
      getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role });

      const result = await requireTenantMembership('tenant-1');

      expect(result.tenant).toEqual({ id: 'tenant-1' });
      expect(result.membership.role).toBe('OWNER');
      expect(result.membership.userId).toBe('user-1');
      expect(result.membership.tenantId).toBe('tenant-1');
      expect(getMembershipMock).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    },
  );

  it("does not gate one tenant's regular membership on a different tenant's membership", async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantByIdMock.mockResolvedValue({ id: 'tenant-1' });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    const membership = {
      id: 'membership-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'OWNER',
      createdAt: new Date(),
    };
    getMembershipMock.mockResolvedValue(membership);

    const result = await requireTenantMembership('tenant-1');

    expect(result).toEqual({
      tenant: { id: 'tenant-1' },
      membership,
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("refuses a member of tenant A supplying tenant B's id: it looks up B, then finds no membership row for A's user on B, and 404s rather than authorizing against A's own membership", async () => {
    authMock.mockResolvedValue({ user: { id: 'user-from-tenant-a' } });
    getTenantByIdMock.mockResolvedValue({ id: 'tenant-b' });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    // The user genuinely has a membership — just not on tenant B, the tenant
    // named in the forged payload.
    getMembershipMock.mockResolvedValue(undefined);

    await expect(requireTenantMembership('tenant-b')).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(getTenantByIdMock).toHaveBeenCalledWith('tenant-b');
    expect(getMembershipMock).toHaveBeenCalledWith(
      'user-from-tenant-a',
      'tenant-b',
    );
  });
});
