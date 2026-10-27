import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { queries } from '@blog/db';
import { ADMIN_ROLE, MEMBERSHIP_ROLE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { auth } from '@platform/server/auth/auth';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_SIGN_IN_HREF } from '@platform/testing/auth/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { isSuperAdmin } from './is-super-admin';
import { requireTenantOwnerOrAdmin } from './require-tenant-owner-or-admin';

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => {
  const { mockDbConstants } =
    await import('@platform/testing/mock-db-constants');

  return {
    ...(await mockDbConstants()),
    queries: {
      memberships: { getMembership: vi.fn() },
      admins: { getAdminByUserId: vi.fn() },
    },
  };
});

faker.seed(5997);

const MOCK_USER_ID = faker.string.uuid();

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);
const getMembership = vi.mocked(queries.memberships.getMembership);
const getAdminByUserId = vi.mocked(queries.admins.getAdminByUserId);

describe(requireTenantOwnerOrAdmin, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: MOCK_USER_ID } });
    getMembership.mockReset();
    getAdminByUserId.mockReset();
    getAdminByUserId.mockResolvedValue(undefined);
    getMembership.mockResolvedValue(mockMembership({ userId: MOCK_USER_ID }));
  });

  it('redirects to sign-in without a session', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(requireTenantOwnerOrAdmin(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(MOCK_SIGN_IN_HREF);
  });

  it('404s for a signed-in user with no membership in the tenant', async () => {
    getMembership.mockResolvedValue(undefined);

    await expect(requireTenantOwnerOrAdmin(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });

  it('404s for an EDITOR of the tenant', async () => {
    getMembership.mockResolvedValue(
      mockMembership({ userId: MOCK_USER_ID, role: MEMBERSHIP_ROLE.EDITOR }),
    );

    await expect(requireTenantOwnerOrAdmin(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });

  it("admits the tenant's OWNER", async () => {
    await expect(
      requireTenantOwnerOrAdmin(MOCK_TENANT_ID),
    ).resolves.toBeUndefined();

    expect(getMembership).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_TENANT_ID);
  });

  it('admits any admin by default, without a membership', async () => {
    getAdminByUserId.mockResolvedValue(
      mockAdmin({ role: ADMIN_ROLE.MODERATOR }),
    );
    getMembership.mockResolvedValue(undefined);

    await expect(
      requireTenantOwnerOrAdmin(MOCK_TENANT_ID),
    ).resolves.toBeUndefined();
  });

  it('404s for an admin the predicate refuses who does not own the tenant', async () => {
    getAdminByUserId.mockResolvedValue(mockAdmin());
    getMembership.mockResolvedValue(undefined);

    await expect(
      requireTenantOwnerOrAdmin(MOCK_TENANT_ID, isSuperAdmin),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it('admits an admin the predicate refuses who owns the tenant', async () => {
    getAdminByUserId.mockResolvedValue(mockAdmin());

    await expect(
      requireTenantOwnerOrAdmin(MOCK_TENANT_ID, isSuperAdmin),
    ).resolves.toBeUndefined();
  });
});
