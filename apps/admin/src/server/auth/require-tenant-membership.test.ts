import { redirect } from 'next/navigation';

import { requireTenantMembership } from './require-tenant-membership';

const { authMock, getTenantBySlugMock, getMembershipMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getTenantBySlugMock: vi.fn(),
  getMembershipMock: vi.fn(),
}));

vi.mock('./auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantBySlug: getTenantBySlugMock },
    memberships: { getMembership: getMembershipMock },
  },
}));

describe(requireTenantMembership, () => {
  beforeEach(() => {
    authMock.mockReset();
    getTenantBySlugMock.mockReset();
    getMembershipMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying the tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireTenantMembership('acme')).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getTenantBySlugMock).not.toHaveBeenCalled();
  });

  it('404s for an unknown tenant slug without checking membership', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantBySlugMock.mockResolvedValue(undefined);

    await expect(requireTenantMembership('ghost')).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(getMembershipMock).not.toHaveBeenCalled();
  });

  it('redirects to /unauthorized when the signed-in user has no membership on that tenant', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantBySlugMock.mockResolvedValue({ id: 'tenant-1', slug: 'acme' });
    getMembershipMock.mockResolvedValue(undefined);

    await expect(requireTenantMembership('acme')).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(getMembershipMock).toHaveBeenCalledWith('user-1', 'tenant-1');
    expect(redirect).toHaveBeenCalledWith('/unauthorized');
  });

  it("does not gate one tenant's membership on an admins row or a different tenant's membership", async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantBySlugMock.mockResolvedValue({ id: 'tenant-1', slug: 'acme' });
    const membership = {
      id: 'membership-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'OWNER',
      createdAt: new Date(),
    };
    getMembershipMock.mockResolvedValue(membership);

    const result = await requireTenantMembership('acme');

    expect(result).toEqual({
      tenant: { id: 'tenant-1', slug: 'acme' },
      membership,
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
