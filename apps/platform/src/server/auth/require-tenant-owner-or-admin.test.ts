import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { ADMIN_ROLE, MEMBERSHIP_ROLE } from '@blog/db/constants';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { makeMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { auth } from './auth';
import { isSuperAdmin } from './is-super-admin';
import { requireTenantOwnerOrAdmin } from './require-tenant-owner-or-admin';

const { getMembershipMock, getAdminByUserIdMock } = vi.hoisted(() => ({
  getMembershipMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('./auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { getMembership: getMembershipMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

const { tenantId, userId } = makeMembership();

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

describe(requireTenantOwnerOrAdmin, () => {
  beforeEach(() => {
    authMock.mockReset();
    getMembershipMock.mockReset();
    getAdminByUserIdMock.mockReset();
    authMock.mockResolvedValue({ user: { id: userId } });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getMembershipMock.mockResolvedValue(makeMembership());
  });

  it('redirects to sign-in without a session', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireTenantOwnerOrAdmin(tenantId)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin?callbackUrl=%2F');
  });

  it('404s for a signed-in user with no membership in the tenant', async () => {
    getMembershipMock.mockResolvedValue(undefined);

    await expect(requireTenantOwnerOrAdmin(tenantId)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });

  it('404s for an EDITOR of the tenant', async () => {
    getMembershipMock.mockResolvedValue(
      makeMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
    );

    await expect(requireTenantOwnerOrAdmin(tenantId)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });

  it("admits the tenant's OWNER", async () => {
    await expect(requireTenantOwnerOrAdmin(tenantId)).resolves.toBe(undefined);

    expect(getMembershipMock).toHaveBeenCalledWith(userId, tenantId);
  });

  it('admits any admin by default, without a membership', async () => {
    getAdminByUserIdMock.mockResolvedValue(
      makeAdmin({ role: ADMIN_ROLE.MODERATOR }),
    );
    getMembershipMock.mockResolvedValue(undefined);

    await expect(requireTenantOwnerOrAdmin(tenantId)).resolves.toBe(undefined);
  });

  it('404s for an admin the predicate refuses who does not own the tenant', async () => {
    getAdminByUserIdMock.mockResolvedValue(makeAdmin());
    getMembershipMock.mockResolvedValue(undefined);

    await expect(
      requireTenantOwnerOrAdmin(tenantId, isSuperAdmin),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it('admits an admin the predicate refuses who owns the tenant', async () => {
    getAdminByUserIdMock.mockResolvedValue(makeAdmin());

    await expect(
      requireTenantOwnerOrAdmin(tenantId, isSuperAdmin),
    ).resolves.toBe(undefined);
  });
});
