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
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { listSessionTenants } from './list-session-tenants';

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => {
  const { mockDbConstants } =
    await import('@platform/testing/mock-db-constants');

  return {
    ...(await mockDbConstants()),
    queries: {
      memberships: { listMembershipsWithTenantsForUser: vi.fn() },
      tenants: { listTenants: vi.fn() },
      admins: { getAdminByUserId: vi.fn() },
    },
  };
});

faker.seed(5997);

const MOCK_USER_ID = faker.string.uuid();
const MOCK_SUPERADMIN_USER_ID = faker.string.uuid();
const MOCK_THIRD_TENANT_ID = faker.string.uuid();
const MOCK_SECOND_MEMBERSHIP_ID = faker.string.uuid();

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);
const listMembershipsWithTenantsForUser = vi.mocked(
  queries.memberships.listMembershipsWithTenantsForUser,
);
const listTenants = vi.mocked(queries.tenants.listTenants);
const getAdminByUserId = vi.mocked(queries.admins.getAdminByUserId);

const NON_SUPERADMIN_ROWS = [
  { adminsRow: 'no admins row', admin: undefined },
  { adminsRow: 'an ADMIN admins row', admin: mockAdmin() },
  {
    adminsRow: 'a MODERATOR admins row',
    admin: mockAdmin({ role: ADMIN_ROLE.MODERATOR }),
  },
];

describe(listSessionTenants, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: MOCK_USER_ID } });
    getAdminByUserId.mockReset();
    listMembershipsWithTenantsForUser.mockReset();
    listTenants.mockReset();
    getAdminByUserId.mockResolvedValue(undefined);
    listMembershipsWithTenantsForUser.mockResolvedValue([]);
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(listSessionTenants()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(MOCK_SIGN_IN_HREF);
    expect(listMembershipsWithTenantsForUser).not.toHaveBeenCalled();
  });

  it.each(NON_SUPERADMIN_ROWS)(
    'redirects to /onboarding with $adminsRow and zero memberships',
    async ({ admin }) => {
      getAdminByUserId.mockResolvedValue(admin);

      await expect(listSessionTenants()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(redirect).toHaveBeenCalledWith(adminRoutes.onboarding());
      expect(listTenants).not.toHaveBeenCalled();
    },
  );

  it('resolves every tenant behind the memberships row set, not a client-supplied list', async () => {
    const tenants = [
      mockTenant({ id: MOCK_TENANT_ID }),
      mockTenant({ id: MOCK_OTHER_TENANT_ID }),
    ];
    const memberships = [
      mockMembership({ userId: MOCK_USER_ID, tenantId: MOCK_TENANT_ID }),
      mockMembership({
        id: MOCK_SECOND_MEMBERSHIP_ID,
        userId: MOCK_USER_ID,
        tenantId: MOCK_OTHER_TENANT_ID,
      }),
    ];
    listMembershipsWithTenantsForUser.mockResolvedValue([
      { membership: memberships[0]!, tenant: tenants[0]! },
      { membership: memberships[1]!, tenant: tenants[1]! },
    ]);

    const result = await listSessionTenants();

    expect(listMembershipsWithTenantsForUser).toHaveBeenCalledWith(
      MOCK_USER_ID,
    );
    expect(result).toEqual({
      userId: MOCK_USER_ID,
      admin: undefined,
      memberships,
      tenants,
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('returns the admins row it read alongside real memberships', async () => {
    const admin = mockAdmin({ userId: MOCK_USER_ID });
    getAdminByUserId.mockResolvedValue(admin);
    listMembershipsWithTenantsForUser.mockResolvedValue([
      {
        membership: mockMembership({ userId: MOCK_USER_ID }),
        tenant: mockTenant(),
      },
    ]);

    const result = await listSessionTenants();

    expect(result.admin).toEqual(admin);
  });

  describe('for a SUPERADMIN', () => {
    const tenants = [
      mockTenant({ id: MOCK_TENANT_ID }),
      mockTenant({ id: MOCK_OTHER_TENANT_ID }),
      mockTenant({ id: MOCK_THIRD_TENANT_ID }),
    ];
    const admin = mockAdmin({
      userId: MOCK_SUPERADMIN_USER_ID,
      role: ADMIN_ROLE.SUPERADMIN,
    });

    beforeEach(() => {
      authMock.mockResolvedValue({ user: { id: MOCK_SUPERADMIN_USER_ID } });
      getAdminByUserId.mockResolvedValue(admin);
      listTenants.mockResolvedValue(tenants);
    });

    it('resolves every tenant, archived included', async () => {
      const result = await listSessionTenants();

      expect(listTenants).toHaveBeenCalledWith({ includeArchived: true });
      expect(result.userId).toBe(MOCK_SUPERADMIN_USER_ID);
      expect(result.admin).toEqual(admin);
      expect(result.tenants).toEqual(tenants);
      expect(redirect).not.toHaveBeenCalled();
    });

    it('grants an OWNER-level virtual membership on each tenant', async () => {
      const { memberships } = await listSessionTenants();

      const grants = memberships.map(({ role, userId, tenantId }) => ({
        role,
        userId,
        tenantId,
      }));

      expect(grants).toEqual(
        tenants.map(({ id }) => ({
          role: MEMBERSHIP_ROLE.OWNER,
          userId: MOCK_SUPERADMIN_USER_ID,
          tenantId: id,
        })),
      );
    });
  });
});
