import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE, MEMBERSHIP_ROLE } from '@blog/db/constants';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { auth } from './auth';
import { requireTenantMembership } from './require-tenant-membership';

const { getTenantByIdMock, getMembershipMock, getAdminByUserIdMock } =
  vi.hoisted(() => ({
    getTenantByIdMock: vi.fn(),
    getMembershipMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
  }));

vi.mock('./auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { getTenantById: getTenantByIdMock },
    memberships: { getMembership: getMembershipMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const USER_FROM_TENANT_A = 'user-from-tenant-a';

describe(requireTenantMembership, () => {
  beforeEach(() => {
    authMock.mockReset();
    getTenantByIdMock.mockReset();
    getMembershipMock.mockReset();
    getAdminByUserIdMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantByIdMock.mockResolvedValue({ id: MOCK_TENANT_ID });
    getAdminByUserIdMock.mockResolvedValue(undefined);
  });

  it('redirects to sign-in without querying the tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireTenantMembership(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith('/sign-in?callbackUrl=%2F');
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('404s for an unknown tenant id without checking membership or admin role', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(requireTenantMembership('ghost')).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getMembershipMock).not.toHaveBeenCalled();
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('404s, as for an unknown id, with no admins row and no membership on the tenant', async () => {
    getMembershipMock.mockResolvedValue(undefined);

    await expect(requireTenantMembership(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getMembershipMock).toHaveBeenCalledWith('user-1', MOCK_TENANT_ID);
    expect(redirect).not.toHaveBeenCalled();
  });

  it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR, ADMIN_ROLE.SUPERADMIN])(
    'grants a %s admins row OWNER-level access with no membership on the tenant',
    async (role) => {
      getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role });

      const result = await requireTenantMembership(MOCK_TENANT_ID);

      expect(result.tenant).toEqual({ id: MOCK_TENANT_ID });
      expect(result.membership.role).toBe(MEMBERSHIP_ROLE.OWNER);
      expect(result.membership.userId).toBe('user-1');
      expect(result.membership.tenantId).toBe(MOCK_TENANT_ID);
      expect(getMembershipMock).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    },
  );

  it("does not gate one tenant's regular membership on a different tenant's membership", async () => {
    const membership = {
      id: 'membership-1',
      userId: 'user-1',
      tenantId: MOCK_TENANT_ID,
      role: MEMBERSHIP_ROLE.OWNER,
      createdAt: new Date(),
    };
    getMembershipMock.mockResolvedValue(membership);

    const result = await requireTenantMembership(MOCK_TENANT_ID);

    expect(result).toEqual({
      tenant: { id: MOCK_TENANT_ID },
      membership,
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("404s a member of tenant A supplying tenant B's id, never authorizing against A", async () => {
    authMock.mockResolvedValue({ user: { id: USER_FROM_TENANT_A } });
    getTenantByIdMock.mockResolvedValue({ id: 'tenant-b' });
    getMembershipMock.mockResolvedValue(undefined);

    await expect(requireTenantMembership('tenant-b')).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getTenantByIdMock).toHaveBeenCalledWith('tenant-b');
    expect(getMembershipMock).toHaveBeenCalledWith(
      USER_FROM_TENANT_A,
      'tenant-b',
    );
  });
});
