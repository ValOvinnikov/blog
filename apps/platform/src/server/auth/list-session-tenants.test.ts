import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE, MEMBERSHIP_ROLE } from '@blog/db/constants';
import { MOCK_SIGN_IN_HREF } from '@platform/testing/auth/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { auth } from './auth';
import { listSessionTenants } from './list-session-tenants';

const {
  listMembershipsWithTenantsForUserMock,
  listTenantsMock,
  getAdminByUserIdMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  listTenantsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('./auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    tenants: { listTenants: listTenantsMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

describe(listSessionTenants, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsWithTenantsForUserMock.mockReset();
    listTenantsMock.mockReset();
    getAdminByUserIdMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(listSessionTenants()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(MOCK_SIGN_IN_HREF);
    expect(listMembershipsWithTenantsForUserMock).not.toHaveBeenCalled();
  });

  it('redirects to /onboarding for a non-SUPERADMIN with zero memberships', async () => {
    await expect(listSessionTenants()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(adminRoutes.onboarding());
  });

  it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR])(
    'redirects to /onboarding for a %s admins row with zero memberships',
    async (role) => {
      getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role });

      await expect(listSessionTenants()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(redirect).toHaveBeenCalledWith(adminRoutes.onboarding());
      expect(listTenantsMock).not.toHaveBeenCalled();
    },
  );

  it('resolves every tenant behind the memberships row set, not a client-supplied list', async () => {
    const memberships = [
      {
        id: 'm-1',
        userId: 'user-1',
        tenantId: MOCK_TENANT_ID,
        role: MEMBERSHIP_ROLE.OWNER,
      },
      {
        id: 'm-2',
        userId: 'user-1',
        tenantId: 'tenant-2',
        role: MEMBERSHIP_ROLE.OWNER,
      },
    ];
    const tenants = [{ id: MOCK_TENANT_ID }, { id: 'tenant-2' }];
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership: memberships[0], tenant: tenants[0] },
      { membership: memberships[1], tenant: tenants[1] },
    ]);

    const result = await listSessionTenants();

    expect(listMembershipsWithTenantsForUserMock).toHaveBeenCalledWith(
      'user-1',
    );
    expect(result).toEqual({
      userId: 'user-1',
      admin: undefined,
      memberships,
      tenants,
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('returns the admins row it read alongside real memberships', async () => {
    const admin = { id: 'admin-1', role: ADMIN_ROLE.ADMIN };
    getAdminByUserIdMock.mockResolvedValue(admin);
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      {
        membership: { id: 'm-1', userId: 'user-1', tenantId: MOCK_TENANT_ID },
        tenant: { id: MOCK_TENANT_ID },
      },
    ]);

    const result = await listSessionTenants();

    expect(result.admin).toEqual(admin);
  });

  it('resolves every tenant for a SUPERADMIN, regardless of their own memberships', async () => {
    authMock.mockResolvedValue({ user: { id: 'super-1' } });
    const admin = { id: 'admin-1', role: ADMIN_ROLE.SUPERADMIN };
    getAdminByUserIdMock.mockResolvedValue(admin);
    const tenants = [
      { id: MOCK_TENANT_ID },
      { id: 'tenant-2' },
      { id: 'tenant-3' },
    ];
    listTenantsMock.mockResolvedValue(tenants);

    const result = await listSessionTenants();

    expect(listTenantsMock).toHaveBeenCalledWith({ includeArchived: true });
    expect(result.userId).toBe('super-1');
    expect(result.admin).toEqual(admin);
    expect(result.tenants).toEqual(tenants);
    expect(result.memberships).toHaveLength(3);
    expect(
      result.memberships.every(
        (membership) =>
          membership.role === MEMBERSHIP_ROLE.OWNER &&
          membership.userId === 'super-1',
      ),
    ).toBe(true);
    expect(redirect).not.toHaveBeenCalled();
  });
});
