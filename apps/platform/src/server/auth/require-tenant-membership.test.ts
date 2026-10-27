import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { queries } from '@blog/db';
import { ADMIN_ROLE, MEMBERSHIP_ROLE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { auth } from '@platform/server/auth/auth';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_SIGN_IN_HREF } from '@platform/testing/auth/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { requireTenantMembership } from './require-tenant-membership';

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => {
  const { mockDbConstants } =
    await import('@platform/testing/mock-db-constants');

  return {
    ...(await mockDbConstants()),
    queries: {
      tenants: { getTenantById: vi.fn() },
      memberships: { getMembership: vi.fn() },
      admins: { getAdminByUserId: vi.fn() },
    },
  };
});

faker.seed(5997);

const MOCK_USER_ID = faker.string.uuid();

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);
const getTenantById = vi.mocked(queries.tenants.getTenantById);
const getMembership = vi.mocked(queries.memberships.getMembership);
const getAdminByUserId = vi.mocked(queries.admins.getAdminByUserId);

const tenant = mockTenant({ id: MOCK_TENANT_ID });

describe(requireTenantMembership, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: MOCK_USER_ID } });
    getTenantById.mockReset();
    getMembership.mockReset();
    getAdminByUserId.mockReset();
    getTenantById.mockResolvedValue(tenant);
    getAdminByUserId.mockResolvedValue(undefined);
  });

  it('redirects to sign-in without querying the tenant when there is no session', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(requireTenantMembership(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(MOCK_SIGN_IN_HREF);
    expect(getTenantById).not.toHaveBeenCalled();
  });

  it('404s for an unknown tenant id without checking membership or admin role', async () => {
    getTenantById.mockResolvedValue(undefined);

    await expect(requireTenantMembership(MOCK_OTHER_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getMembership).not.toHaveBeenCalled();
    expect(getAdminByUserId).not.toHaveBeenCalled();
  });

  it('404s, as for an unknown id, with no admins row and no membership on the tenant', async () => {
    getMembership.mockResolvedValue(undefined);

    await expect(requireTenantMembership(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getMembership).toHaveBeenCalledWith(MOCK_USER_ID, MOCK_TENANT_ID);
    expect(redirect).not.toHaveBeenCalled();
  });

  it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR, ADMIN_ROLE.SUPERADMIN])(
    'grants a %s admins row OWNER-level access with no membership on the tenant',
    async (role) => {
      getAdminByUserId.mockResolvedValue(mockAdmin({ role }));

      const result = await requireTenantMembership(MOCK_TENANT_ID);

      expect(result.tenant).toEqual(tenant);
      expect(result.membership.role).toBe(MEMBERSHIP_ROLE.OWNER);
      expect(result.membership.userId).toBe(MOCK_USER_ID);
      expect(result.membership.tenantId).toBe(MOCK_TENANT_ID);
      expect(getMembership).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    },
  );

  it("returns the member's own membership on the tenant", async () => {
    const membership = mockMembership({
      userId: MOCK_USER_ID,
      tenantId: MOCK_TENANT_ID,
    });
    getMembership.mockResolvedValue(membership);

    const result = await requireTenantMembership(MOCK_TENANT_ID);

    expect(result).toEqual({ tenant, membership });
    expect(redirect).not.toHaveBeenCalled();
  });
});
